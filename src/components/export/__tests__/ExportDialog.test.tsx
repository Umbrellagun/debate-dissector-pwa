import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportDialog } from '../ExportDialog';
import { DebateDocument, UserPreferences } from '../../../models';

jest.mock('../../../hooks/useAnalytics', () => ({ trackAnalyticsEvent: jest.fn() }));
jest.mock('../../../context', () => ({ useApp: () => ({ updatePreferences: jest.fn() }) }));
jest.mock('../../../services/export', () => {
  const actual = jest.requireActual('../../../services/export');
  return {
    __esModule: true,
    ...actual,
    exportArgumentMapAsPng: jest.fn(() => Promise.resolve()),
    exportArgumentMapAsSvg: jest.fn(() => Promise.resolve()),
  };
});

import { exportArgumentMapAsPng, exportArgumentMapAsSvg } from '../../../services/export';

const doc: DebateDocument = {
  id: 'doc-1',
  title: 'Test',
  content: [],
  speakers: [],
  annotations: {},
  createdAt: 0,
  updatedAt: 0,
};

// Only `plan` and `customColors` are read by the dialog.
const proPreferences = { plan: 'pro' } as unknown as UserPreferences;
const freePreferences = { plan: 'free' } as unknown as UserPreferences;

describe('ExportDialog map exports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enables map exports without requiring the user to switch views first', () => {
    render(
      <ExportDialog
        isOpen
        onClose={jest.fn()}
        doc={doc}
        preferences={proPreferences}
        onEnsureMapView={jest.fn(() => Promise.resolve(null))}
      />
    );

    const pngBtn = screen.getByRole('button', { name: /Map PNG/ }) as HTMLButtonElement;
    const svgBtn = screen.getByRole('button', { name: /Map SVG/ }) as HTMLButtonElement;
    expect(pngBtn.disabled).toBe(false);
    expect(svgBtn.disabled).toBe(false);
  });

  it('loads the map view, then exports with the resolved container', async () => {
    const container = document.createElement('div');
    const onEnsureMapView = jest.fn(() => Promise.resolve(container));
    const onClose = jest.fn();

    render(
      <ExportDialog
        isOpen
        onClose={onClose}
        doc={doc}
        preferences={proPreferences}
        onEnsureMapView={onEnsureMapView}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Map PNG/ }));

    await waitFor(() => expect(onEnsureMapView).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(exportArgumentMapAsPng).toHaveBeenCalledWith(container, doc));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('does not attempt export if the map never becomes available', async () => {
    const onEnsureMapView = jest.fn(() => Promise.resolve(null));
    const onClose = jest.fn();

    render(
      <ExportDialog
        isOpen
        onClose={onClose}
        doc={doc}
        preferences={proPreferences}
        onEnsureMapView={onEnsureMapView}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Map SVG/ }));

    await waitFor(() => expect(onEnsureMapView).toHaveBeenCalledTimes(1));
    expect(exportArgumentMapAsSvg).not.toHaveBeenCalled();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe('ExportDialog Pro gating', () => {
  it('does not render any Pro-unlock control outside development', () => {
    // Jest runs with NODE_ENV='test' (i.e. not 'development'), matching how a
    // production build behaves — the dev-only unlock button must be absent.
    render(
      <ExportDialog
        isOpen
        onClose={jest.fn()}
        doc={doc}
        preferences={freePreferences}
        onEnsureMapView={jest.fn(() => Promise.resolve(null))}
      />
    );

    expect(screen.queryByRole('button', { name: /Enable Pro for testing/i })).toBeNull();
  });
});
