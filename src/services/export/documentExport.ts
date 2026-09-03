import { DebateDocument } from '../../models';
import { CustomElement, CustomText } from '../../components/editor/types';
import {
  getFallacyInfo,
  getRhetoricInfo,
  getStructuralInfo,
  isColorDark,
  TagInfo,
} from '../../components/editor/markTagUtils';
import { downloadFile } from './download';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getSpeaker(doc: DebateDocument, speakerId?: string) {
  if (!speakerId || !doc.speakers) return undefined;
  return doc.speakers.find(s => s.id === speakerId);
}

function isHidden(doc: DebateDocument, type: 'fallacy' | 'rhetoric' | 'structural', id: string) {
  if (!doc.hiddenAnnotationIds) return false;
  if (type === 'fallacy') return doc.hiddenAnnotationIds.fallacyIds.includes(id);
  if (type === 'rhetoric') return doc.hiddenAnnotationIds.rhetoricIds.includes(id);
  return doc.hiddenAnnotationIds.structuralIds.includes(id);
}

function collectMarkInfos(
  textNode: CustomText,
  customColors?: Record<string, string>,
  doc?: DebateDocument
): TagInfo[] {
  const infos: TagInfo[] = [];
  const fallacyMarks = (textNode.fallacyMarks || []).filter(
    m => !doc || !isHidden(doc, 'fallacy', m.fallacyId)
  );
  const rhetoricMarks = (textNode.rhetoricMarks || []).filter(
    m => !doc || !isHidden(doc, 'rhetoric', m.rhetoricId)
  );
  const structuralMarks = (textNode.structuralMarks || []).filter(
    m => !doc || !isHidden(doc, 'structural', m.markupId)
  );

  for (const mark of fallacyMarks) infos.push(getFallacyInfo(mark, customColors));
  for (const mark of rhetoricMarks) infos.push(getRhetoricInfo(mark, customColors));
  for (const mark of structuralMarks) infos.push(getStructuralInfo(mark, customColors));

  // Legacy single-fallacy fallback
  if (
    textNode.fallacyId &&
    fallacyMarks.length === 0 &&
    (!doc || !isHidden(doc, 'fallacy', textNode.fallacyId))
  ) {
    infos.push(
      getFallacyInfo(
        {
          id: 'legacy',
          fallacyId: textNode.fallacyId,
          color: textNode.fallacyColor || '#000',
          appliedAt: 0,
        },
        customColors
      )
    );
  }

  return infos;
}

function renderAnnotationChips(infos: TagInfo[]): string {
  if (infos.length === 0) return '';
  return infos
    .map(info => {
      const textColor = isColorDark(info.color) ? '#ffffff' : '#111111';
      return `<span style="display:inline-block;font-size:10px;font-weight:600;line-height:1.5;padding:0 5px;border-radius:8px;margin-left:3px;vertical-align:middle;white-space:nowrap;background-color:${info.color};color:${textColor};" title="${escapeHtml(`${info.category}: ${info.label}`)}">${escapeHtml(info.label)}</span>`;
    })
    .join('');
}

interface LeafStyle {
  backgroundColor?: string;
  color?: string;
  borderBottom?: string;
  borderRadius?: string;
  padding?: string;
  boxShadow?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
}

function getLeafStyleAndTitle(
  textNode: CustomText,
  customColors?: Record<string, string>,
  doc?: DebateDocument
): { style: LeafStyle; title: string } {
  const style: LeafStyle = {};
  const titleParts: string[] = [];

  const fallacyMarks = (textNode.fallacyMarks || []).filter(
    m => !doc || !isHidden(doc, 'fallacy', m.fallacyId)
  );
  const rhetoricMarks = (textNode.rhetoricMarks || []).filter(
    m => !doc || !isHidden(doc, 'rhetoric', m.rhetoricId)
  );
  const structuralMarks = (textNode.structuralMarks || []).filter(
    m => !doc || !isHidden(doc, 'structural', m.markupId)
  );

  for (const mark of fallacyMarks) {
    const info = getFallacyInfo(mark, customColors);
    titleParts.push(`${info.category}: ${info.label}`);
  }
  for (const mark of rhetoricMarks) {
    const info = getRhetoricInfo(mark, customColors);
    titleParts.push(`${info.category}: ${info.label}`);
  }
  for (const mark of structuralMarks) {
    const info = getStructuralInfo(mark, customColors);
    titleParts.push(`${info.category}: ${info.label}`);
  }

  // Legacy fallacy
  if (
    textNode.fallacyId &&
    fallacyMarks.length === 0 &&
    (!doc || !isHidden(doc, 'fallacy', textNode.fallacyId))
  ) {
    const info = getFallacyInfo(
      {
        id: 'legacy',
        fallacyId: textNode.fallacyId,
        color: textNode.fallacyColor || '#000',
        appliedAt: 0,
      },
      customColors
    );
    titleParts.push(`${info.category}: ${info.label}`);
  }

  const hasFallacy = fallacyMarks.length > 0 || (textNode.fallacyId && fallacyMarks.length === 0);
  const hasRhetoric = rhetoricMarks.length > 0;
  const hasStructural = structuralMarks.length > 0;

  if (hasFallacy || hasRhetoric) {
    const lastFallacy = fallacyMarks[fallacyMarks.length - 1];
    const lastRhetoric = rhetoricMarks[rhetoricMarks.length - 1];
    let displayColor: string | undefined;

    if (lastFallacy && lastRhetoric) {
      const fallacyColor = getFallacyInfo(lastFallacy, customColors).color;
      const rhetoricColor = getRhetoricInfo(lastRhetoric, customColors).color;
      displayColor =
        (lastFallacy.appliedAt || 0) > (lastRhetoric.appliedAt || 0) ? fallacyColor : rhetoricColor;
    } else if (lastFallacy) {
      displayColor = getFallacyInfo(lastFallacy, customColors).color;
    } else if (lastRhetoric) {
      displayColor = getRhetoricInfo(lastRhetoric, customColors).color;
    } else if (textNode.fallacyId) {
      displayColor = getFallacyInfo(
        {
          id: 'legacy',
          fallacyId: textNode.fallacyId,
          color: textNode.fallacyColor || '#000',
          appliedAt: 0,
        },
        customColors
      ).color;
    }

    if (displayColor) {
      style.backgroundColor = displayColor;
      style.padding = '2px 0';
      style.borderRadius = '2px';
      if (isColorDark(displayColor)) {
        style.color = '#ffffff';
      }
    }
  }

  if (hasStructural) {
    const lastStructural = structuralMarks[structuralMarks.length - 1];
    const structuralColor = getStructuralInfo(lastStructural, customColors).color;
    style.borderBottom = `2px dotted ${structuralColor}`;
    if (!style.backgroundColor) {
      style.backgroundColor = `${structuralColor}20`;
    }
  }

  if (textNode.bold) style.fontWeight = 'bold';
  if (textNode.italic) style.fontStyle = 'italic';
  const decorations: string[] = [];
  if (textNode.underline) decorations.push('underline');
  if (textNode.strikethrough) decorations.push('line-through');
  if (decorations.length) style.textDecoration = decorations.join(' ');

  return { style, title: titleParts.join(' | ') };
}

function renderTextToHtml(
  textNode: CustomText,
  customColors?: Record<string, string>,
  doc?: DebateDocument
): string {
  if (!textNode.text) return '';
  const { style, title } = getLeafStyleAndTitle(textNode, customColors, doc);
  const chips = renderAnnotationChips(collectMarkInfos(textNode, customColors, doc));
  const text = escapeHtml(textNode.text);
  const styleAttr = Object.entries(style)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
    .join(';');
  if (styleAttr) {
    return `<span style="${styleAttr}" title="${escapeHtml(title)}">${text}</span>${chips}`;
  }
  return `${text}${chips}`;
}

function renderElementToHtml(
  element: CustomElement,
  doc: DebateDocument,
  customColors?: Record<string, string>
): string {
  const speakerId = 'speakerId' in element ? element.speakerId : undefined;
  const speaker = getSpeaker(doc, speakerId);
  const textContent = (element.children || [])
    .map(child => renderTextToHtml(child as CustomText, customColors, doc))
    .join('');

  const speakerBadge = speaker
    ? `<span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:12px;font-weight:600;background-color:${speaker.color}18;color:${speaker.color};margin-right:6px;">${escapeHtml(speaker.name)}</span>`
    : '';

  if (element.type === 'heading-one') {
    return `<h1 style="font-size:24px;font-weight:700;margin:16px 0 8px;">${speakerBadge}${textContent}</h1>`;
  }
  if (element.type === 'heading-two') {
    return `<h2 style="font-size:20px;font-weight:600;margin:14px 0 6px;">${speakerBadge}${textContent}</h2>`;
  }
  if (element.type === 'block-quote') {
    return `<blockquote style="border-left:4px solid #10B981;padding-left:12px;margin:8px 0;color:#374151;font-style:italic;">${speakerBadge}${textContent}</blockquote>`;
  }
  return `<p style="margin:8px 0;line-height:1.6;">${speakerBadge}${textContent}</p>`;
}

export function renderDocumentHtmlBody(
  doc: DebateDocument,
  customColors?: Record<string, string>
): string {
  const elements = doc.content
    .filter((node): node is CustomElement => 'type' in node && typeof node.type === 'string')
    .map(node => renderElementToHtml(node as CustomElement, doc, customColors))
    .join('');

  return `<h1 style="font-size:28px;font-weight:700;margin-bottom:16px;">${escapeHtml(doc.title || 'Untitled')}</h1>${elements}`;
}

function renderTextNodeToPlainText(textNode: CustomText, doc?: DebateDocument): string {
  const text = textNode.text || '';
  if (!text) return '';
  const infos = collectMarkInfos(textNode, undefined, doc);
  if (infos.length === 0) return text;
  const tags = infos.map(i => `${i.category}: ${i.label}`).join('; ');
  return `${text} [${tags}]`;
}

export function exportDocumentAsText(doc: DebateDocument): void {
  const lines: string[] = [];
  if (doc.title) lines.push(doc.title, '');

  for (const node of doc.content) {
    const element = node as CustomElement;
    const speakerId = 'speakerId' in element ? element.speakerId : undefined;
    const speaker = getSpeaker(doc, speakerId);
    const prefix = speaker ? `${speaker.name}: ` : '';
    const text = (element.children || [])
      .map(child => renderTextNodeToPlainText(child as CustomText, doc))
      .join('');
    if (element.type === 'heading-one') {
      lines.push(`# ${prefix}${text}`);
    } else if (element.type === 'heading-two') {
      lines.push(`## ${prefix}${text}`);
    } else {
      lines.push(`${prefix}${text}`);
    }
  }

  const content = lines.join('\n');
  downloadFile(content, `${sanitizeFilename(doc.title || 'untitled')}.txt`, 'text/plain');
}

export function exportDocumentAsHtml(
  doc: DebateDocument,
  customColors?: Record<string, string>
): void {
  const body = renderDocumentHtmlBody(doc, customColors);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(doc.title || 'Untitled')}</title>
<style>
  body { font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #111; background: #fff; }
  h1 { font-size: 28px; font-weight: 700; margin-bottom: 16px; }
</style>
</head>
<body>
${body}
</body>
</html>`;
  downloadFile(html, `${sanitizeFilename(doc.title || 'untitled')}.html`, 'text/html');
}

export function exportDocumentAsJson(doc: DebateDocument): void {
  const content = JSON.stringify(doc, null, 2);
  downloadFile(content, `${sanitizeFilename(doc.title || 'untitled')}.json`, 'application/json');
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'untitled';
}
