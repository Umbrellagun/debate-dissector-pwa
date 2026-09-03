import { DebateDocument } from '../../models';
import { AnnotationStats, AnnotationCount } from '../../utils/annotationStats';
import { exportHtmlBodyToPdf } from './pdfExport';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'untitled';
}

export function exportStatsReportAsHtml(
  doc: DebateDocument,
  stats: AnnotationStats,
  _customColors?: Record<string, string>
): string {
  const speakerRows = stats.speakerStats
    .map(s => {
      return `<tr>
        <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(s.name)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${s.annotationCount}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${s.charCount}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${s.coveragePercent}%</td>
      </tr>`;
    })
    .join('');

  const topItems = (items: AnnotationCount[]) =>
    items
      .slice(0, 10)
      .map(
        item =>
          `<li style="margin:4px 0;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:6px;"></span>${escapeHtml(item.name)}: ${item.count}</li>`
      )
      .join('');

  const byType = (type: AnnotationCount['type']) =>
    stats.breakdown.filter(item => item.type === type).sort((a, b) => b.count - a.count);

  const body = `
    <h1>Annotation Statistics Report</h1>
    <p style="color:#6b7280;">Document: ${escapeHtml(doc.title || 'Untitled')}</p>

    <h2 style="font-size:18px;margin-top:24px;">Overview</h2>
    <table style="border-collapse:collapse;width:100%;max-width:600px;">
      <tr><td style="padding:8px;border:1px solid #e5e7eb;">Total annotations</td><td style="padding:8px;border:1px solid #e5e7eb;">${stats.totalAnnotations}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;">Fallacies</td><td style="padding:8px;border:1px solid #e5e7eb;">${stats.fallacyCount}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;">Rhetoric techniques</td><td style="padding:8px;border:1px solid #e5e7eb;">${stats.rhetoricCount}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;">Structural markups</td><td style="padding:8px;border:1px solid #e5e7eb;">${stats.structuralCount}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;">Coverage</td><td style="padding:8px;border:1px solid #e5e7eb;">${stats.coveragePercent}%</td></tr>
    </table>

    <h2 style="font-size:18px;margin-top:24px;">Top Fallacies</h2>
    <ul style="list-style:none;padding:0;">${topItems(byType('fallacy'))}</ul>

    <h2 style="font-size:18px;margin-top:24px;">Top Rhetoric Techniques</h2>
    <ul style="list-style:none;padding:0;">${topItems(byType('rhetoric'))}</ul>

    <h2 style="font-size:18px;margin-top:24px;">Top Structural Markups</h2>
    <ul style="list-style:none;padding:0;">${topItems(byType('structural'))}</ul>

    <h2 style="font-size:18px;margin-top:24px;">By Speaker</h2>
    <table style="border-collapse:collapse;width:100%;max-width:600px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Speaker</th>
          <th style="padding:8px;border:1px solid #e5e7eb;">Annotations</th>
          <th style="padding:8px;border:1px solid #e5e7eb;">Characters</th>
          <th style="padding:8px;border:1px solid #e5e7eb;">Coverage</th>
        </tr>
      </thead>
      <tbody>${speakerRows}</tbody>
    </table>
  `;

  return body;
}

export async function exportStatsReportAsPdf(
  doc: DebateDocument,
  stats: AnnotationStats,
  customColors?: Record<string, string>
): Promise<void> {
  const body = exportStatsReportAsHtml(doc, stats, customColors);
  await exportHtmlBodyToPdf(body, `${sanitizeFilename(doc.title || 'untitled')}-stats.pdf`);
}
