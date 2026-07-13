import { downloadFile } from './download';

const PDF_PAGE_WIDTH = 794; // A4 width in CSS pixels at 96 DPI
const PDF_PAGE_HEIGHT = 1123; // A4 height in CSS pixels at 96 DPI
const PDF_PIXEL_RATIO = 2;

function createOffscreenContainer(htmlBody: string): HTMLDivElement {
  const div = document.createElement('div');
  div.innerHTML = htmlBody;
  div.style.position = 'fixed';
  div.style.left = '-9999px';
  div.style.top = '0';
  div.style.width = `${PDF_PAGE_WIDTH}px`;
  div.style.backgroundColor = '#ffffff';
  div.style.color = '#111111';
  div.style.padding = '40px';
  div.style.overflow = 'visible';
  div.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  div.style.fontSize = '14px';
  div.style.lineHeight = '1.6';
  document.body.appendChild(div);
  return div;
}

async function splitImageToPdf(
  imageDataUrl: string,
  imageWidth: number,
  imageHeight: number,
  filename: string
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageDataUrl;
  });

  const pageHeightCanvas = Math.floor(PDF_PAGE_HEIGHT * PDF_PIXEL_RATIO);
  const totalPages = Math.ceil(imageHeight / pageHeightCanvas);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  for (let page = 0; page < totalPages; page++) {
    const sy = page * pageHeightCanvas;
    const sh = Math.min(pageHeightCanvas, imageHeight - sy);
    canvas.width = imageWidth;
    canvas.height = sh;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, sy, imageWidth, sh, 0, 0, imageWidth, sh);

    if (page > 0) pdf.addPage();
    const dataUrl = canvas.toDataURL('image/png');
    pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight);
  }

  pdf.save(filename);
}

export async function exportHtmlBodyToPdf(htmlBody: string, filename: string): Promise<void> {
  const htmlToImage = await import('html-to-image');
  const container = createOffscreenContainer(htmlBody);

  try {
    const canvas = await htmlToImage.toCanvas(container, {
      pixelRatio: PDF_PIXEL_RATIO,
      width: PDF_PAGE_WIDTH,
    });
    await splitImageToPdf(canvas.toDataURL('image/png'), canvas.width, canvas.height, filename);
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

export async function exportElementToPdf(element: HTMLElement, filename: string): Promise<void> {
  const htmlToImage = await import('html-to-image');
  const canvas = await htmlToImage.toCanvas(element, {
    pixelRatio: PDF_PIXEL_RATIO,
  });
  await splitImageToPdf(canvas.toDataURL('image/png'), canvas.width, canvas.height, filename);
}

export function exportDataUrl(dataUrl: string, filename: string, type: string): void {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  downloadFile(bytes, filename, type);
}
