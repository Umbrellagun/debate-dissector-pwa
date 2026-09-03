import { exportDataUrl } from '../pdfExport';

jest.mock('../download', () => ({
  downloadFile: jest.fn(),
}));

import { downloadFile } from '../download';

describe('exportDataUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('decodes base64 data URLs (e.g. PNG) into raw bytes', () => {
    const original = [0x89, 0x50, 0x4e, 0x47]; // PNG magic number
    const base64 = btoa(String.fromCharCode(...original));
    exportDataUrl(`data:image/png;base64,${base64}`, 'map.png', 'image/png');

    expect(downloadFile).toHaveBeenCalledTimes(1);
    const [content, filename, type] = (downloadFile as jest.Mock).mock.calls[0];
    expect(content).toBeInstanceOf(Uint8Array);
    expect(Array.from(content as Uint8Array)).toEqual(original);
    expect(filename).toBe('map.png');
    expect(type).toBe('image/png');
  });

  it('decodes percent-encoded SVG data URLs without throwing (regression)', () => {
    // html-to-image's toSvg returns `data:image/svg+xml;charset=utf-8,<escaped>`
    // which is NOT base64 — atob() previously threw InvalidCharacterError here.
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>Straw Man → premise —</text></svg>';
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

    expect(() => exportDataUrl(dataUrl, 'map.svg', 'image/svg+xml')).not.toThrow();

    expect(downloadFile).toHaveBeenCalledTimes(1);
    const [content, filename, type] = (downloadFile as jest.Mock).mock.calls[0];
    // Passed as the decoded markup string; Blob handles UTF-8 (incl. → and —).
    expect(content).toBe(svg);
    expect(filename).toBe('map.svg');
    expect(type).toBe('image/svg+xml');
  });
});
