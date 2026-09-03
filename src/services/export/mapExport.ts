import { exportDataUrl } from './pdfExport';

// Background matching the map canvas (Tailwind bg-gray-50) so exports aren't transparent.
const MAP_EXPORT_BACKGROUND = '#f9fafb';

/**
 * The argument map is rendered inside react-zoom-pan-pinch. The pan/zoom
 * transform is applied to `.react-transform-component`, which lives inside an
 * `overflow: hidden` wrapper. Capturing the outer container therefore only
 * grabs the visible viewport and clips any panned/zoomed-out content.
 *
 * To export the entire map we capture the transform content element itself and
 * neutralise its transform, so html-to-image serialises the node's full subtree
 * at natural size regardless of the current zoom/pan or the wrapper clipping.
 */
export function resolveMapCaptureTarget(element: HTMLElement): HTMLElement {
  return (
    element.querySelector<HTMLElement>('.react-transform-component') ||
    element.querySelector<HTMLElement>('[data-map-export-root]') ||
    element
  );
}

/**
 * Waits until the argument map has mounted and laid out inside its container so
 * it can be captured in full. Resolves once the react-zoom-pan-pinch canvas (or
 * the empty state) is present, with a short settle window so connector arrows —
 * which are measured one animation frame after layout — are included. Falls back
 * to whatever container exists if the map does not become ready before timeout.
 */
export function waitForMapCaptureReady(
  getContainer: () => HTMLElement | null,
  timeoutMs = 5000,
  settleMs = 90
): Promise<HTMLElement | null> {
  return new Promise(resolve => {
    const start = Date.now();

    const tick = () => {
      const container = getContainer();
      if (container) {
        // A map with no markups renders a static empty state, not the canvas.
        if (container.querySelector('#map-view-empty')) {
          resolve(container);
          return;
        }
        const content = container.querySelector<HTMLElement>('.react-transform-component');
        if (content && content.scrollHeight > 0) {
          window.setTimeout(() => resolve(container), settleMs);
          return;
        }
      }
      if (Date.now() - start > timeoutMs) {
        resolve(container);
        return;
      }
      window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
  });
}

function getMapExportOptions() {
  return {
    pixelRatio: 2,
    backgroundColor: MAP_EXPORT_BACKGROUND,
    filter: (node: Node) => {
      const el = node as HTMLElement;
      if (el && el.dataset && el.dataset.noExport) return false;
      return true;
    },
    style: {
      transform: 'none',
      transformOrigin: 'top left',
      margin: '0',
    } as unknown as Record<string, string>,
  };
}

export async function exportElementAsPng(element: HTMLElement, filename: string): Promise<void> {
  const htmlToImage = await import('html-to-image');
  const target = resolveMapCaptureTarget(element);
  const dataUrl = await htmlToImage.toPng(target, getMapExportOptions());
  exportDataUrl(dataUrl, filename, 'image/png');
}

export async function exportElementAsSvg(element: HTMLElement, filename: string): Promise<void> {
  const htmlToImage = await import('html-to-image');
  const target = resolveMapCaptureTarget(element);
  const dataUrl = await htmlToImage.toSvg(target, getMapExportOptions());
  exportDataUrl(dataUrl, filename, 'image/svg+xml');
}
