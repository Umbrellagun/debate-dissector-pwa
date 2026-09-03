import { resolveMapCaptureTarget } from '../mapExport';

describe('resolveMapCaptureTarget', () => {
  it('prefers the react-zoom-pan-pinch transform content element', () => {
    const container = document.createElement('div');
    const wrapper = document.createElement('div');
    wrapper.className = 'react-transform-wrapper';
    const content = document.createElement('div');
    content.className = 'react-transform-component';
    const inner = document.createElement('div');
    inner.setAttribute('data-map-export-root', 'true');

    content.appendChild(inner);
    wrapper.appendChild(content);
    container.appendChild(wrapper);

    // The transform content element holds the full (un-clipped) map subtree.
    expect(resolveMapCaptureTarget(container)).toBe(content);
  });

  it('falls back to the tagged export root when the transform class is absent', () => {
    const container = document.createElement('div');
    const inner = document.createElement('div');
    inner.setAttribute('data-map-export-root', 'true');
    container.appendChild(inner);

    expect(resolveMapCaptureTarget(container)).toBe(inner);
  });

  it('falls back to the element itself when no known target exists', () => {
    const container = document.createElement('div');
    expect(resolveMapCaptureTarget(container)).toBe(container);
  });
});
