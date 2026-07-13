import { DebateDocument } from '../../models';
import {
  exportDocumentAsText,
  exportDocumentAsHtml,
  exportDocumentAsJson,
  renderDocumentHtmlBody,
} from './documentExport';
import { exportHtmlBodyToPdf } from './pdfExport';
import { exportElementAsPng, exportElementAsSvg } from './mapExport';
import { exportStatsReportAsPdf } from './statsExport';

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'untitled';
}

export async function exportDocumentAsPdf(
  doc: DebateDocument,
  customColors?: Record<string, string>
): Promise<void> {
  const body = renderDocumentHtmlBody(doc, customColors);
  await exportHtmlBodyToPdf(body, `${sanitizeFilename(doc.title || 'untitled')}.pdf`);
}

export async function exportArgumentMapAsPng(
  mapElement: HTMLElement,
  doc: DebateDocument
): Promise<void> {
  await exportElementAsPng(mapElement, `${sanitizeFilename(doc.title || 'untitled')}-map.png`);
}

export async function exportArgumentMapAsSvg(
  mapElement: HTMLElement,
  doc: DebateDocument
): Promise<void> {
  await exportElementAsSvg(mapElement, `${sanitizeFilename(doc.title || 'untitled')}-map.svg`);
}

export { exportDocumentAsText, exportDocumentAsHtml, exportDocumentAsJson, exportStatsReportAsPdf };

export type ExportFormat = 'text' | 'html' | 'json' | 'pdf' | 'map-png' | 'map-svg' | 'stats-pdf';

export interface ExportOption {
  format: ExportFormat;
  label: string;
  description: string;
  pro: boolean;
  requiresMap: boolean;
}

export const EXPORT_OPTIONS: ExportOption[] = [
  {
    format: 'text',
    label: 'Plain Text',
    description: 'Simple text with speaker labels',
    pro: false,
    requiresMap: false,
  },
  {
    format: 'html',
    label: 'Annotated HTML',
    description: 'Rich HTML with colors preserved',
    pro: true,
    requiresMap: false,
  },
  {
    format: 'json',
    label: 'JSON',
    description: 'Structured document data',
    pro: true,
    requiresMap: false,
  },
  {
    format: 'pdf',
    label: 'PDF',
    description: 'Printable PDF with annotations',
    pro: true,
    requiresMap: false,
  },
  {
    format: 'map-png',
    label: 'Map PNG',
    description: 'Argument map as PNG image',
    pro: true,
    requiresMap: true,
  },
  {
    format: 'map-svg',
    label: 'Map SVG',
    description: 'Argument map as SVG vector',
    pro: true,
    requiresMap: true,
  },
  {
    format: 'stats-pdf',
    label: 'Stats Report',
    description: 'Annotation statistics as PDF',
    pro: true,
    requiresMap: false,
  },
];
