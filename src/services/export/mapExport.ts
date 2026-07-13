import { exportDataUrl } from './pdfExport';

function getMapExportOptions() {
  return {
    pixelRatio: 2,
    filter: (node: Node) => {
      const el = node as HTMLElement;
      if (el && el.dataset && el.dataset.noExport) return false;
      return true;
    },
    style: {
      transform: 'none',
      transformOrigin: 'top left',
    } as unknown as Record<string, string>,
  };
}

export async function exportElementAsPng(element: HTMLElement, filename: string): Promise<void> {
  const htmlToImage = await import('html-to-image');
  const dataUrl = await htmlToImage.toPng(element, getMapExportOptions());
  exportDataUrl(dataUrl, filename, 'image/png');
}

export async function exportElementAsSvg(element: HTMLElement, filename: string): Promise<void> {
  const htmlToImage = await import('html-to-image');
  const dataUrl = await htmlToImage.toSvg(element, getMapExportOptions());
  exportDataUrl(dataUrl, filename, 'image/svg+xml');
}
