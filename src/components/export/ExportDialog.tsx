import React, { useState } from 'react';
import { DebateDocument } from '../../models';
import { UserPreferences } from '../../models';
import { AnnotationStats } from '../../utils/annotationStats';
import { useApp } from '../../context';
import { ProBadge } from './ProBadge';
import {
  exportDocumentAsText,
  exportDocumentAsHtml,
  exportDocumentAsJson,
  exportDocumentAsPdf,
  exportArgumentMapAsPng,
  exportArgumentMapAsSvg,
  exportStatsReportAsPdf,
  EXPORT_OPTIONS,
  ExportFormat,
} from '../../services/export';
import { trackAnalyticsEvent } from '../../hooks/useAnalytics';

export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doc: DebateDocument;
  preferences: UserPreferences;
  /**
   * Switches the editor into map view (if needed), waits for the map to finish
   * laying out, and resolves with its container element for capture.
   */
  onEnsureMapView: () => Promise<HTMLElement | null>;
  stats?: AnnotationStats;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  doc,
  preferences,
  onEnsureMapView,
  stats,
}) => {
  const { updatePreferences } = useApp();
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const isPro = preferences.plan === 'pro';

  if (!isOpen) return null;

  const handleExport = async (format: ExportFormat, isProOption: boolean) => {
    if (isProOption && !isPro) return;

    setExporting(format);
    try {
      switch (format) {
        case 'text':
          exportDocumentAsText(doc);
          trackAnalyticsEvent('document_exported', { format: 'text' });
          break;
        case 'html':
          exportDocumentAsHtml(doc, preferences.customColors);
          trackAnalyticsEvent('document_exported', { format: 'html' });
          break;
        case 'json':
          exportDocumentAsJson(doc);
          trackAnalyticsEvent('document_exported', { format: 'json' });
          break;
        case 'pdf':
          await exportDocumentAsPdf(doc, preferences.customColors);
          trackAnalyticsEvent('document_exported', { format: 'pdf' });
          break;
        case 'map-png': {
          const el = await onEnsureMapView();
          if (el) {
            await exportArgumentMapAsPng(el, doc);
            trackAnalyticsEvent('document_exported', { format: 'map-png' });
          }
          break;
        }
        case 'map-svg': {
          const el = await onEnsureMapView();
          if (el) {
            await exportArgumentMapAsSvg(el, doc);
            trackAnalyticsEvent('document_exported', { format: 'map-svg' });
          }
          break;
        }
        case 'stats-pdf':
          if (stats) {
            await exportStatsReportAsPdf(doc, stats, preferences.customColors);
            trackAnalyticsEvent('document_exported', { format: 'stats-pdf' });
          }
          break;
      }
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const unlockPro = async () => {
    await updatePreferences({ plan: 'pro' });
    trackAnalyticsEvent('settings_changed', { setting: 'plan', value: 'pro' });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Export options"
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Export</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="Close export dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-2">
          {EXPORT_OPTIONS.map(option => {
            const disabled =
              exporting !== null ||
              (option.pro && !isPro) ||
              (option.format === 'stats-pdf' && !stats);
            const active = !disabled;

            return (
              <button
                key={option.format}
                onClick={() => handleExport(option.format, option.pro)}
                disabled={!active}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                  active
                    ? 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{option.label}</span>
                    {option.pro && <ProBadge size="sm" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                  {option.format === 'stats-pdf' && !stats && (
                    <p className="text-[10px] text-amber-600 mt-0.5">No statistics available</p>
                  )}
                </div>
                {exporting === option.format ? (
                  <svg
                    className="w-4 h-4 animate-spin text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <svg
                    className={`w-4 h-4 ${active ? 'text-gray-400' : 'text-gray-300'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {!isPro && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">
              Pro exports are locked. The upgrade flow is in development.
            </p>
            {/* Dev-only unlock: removed from production builds via the NODE_ENV
                guard so Pro cannot be enabled without a real billing flow. */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={unlockPro}
                className="w-full py-2 px-4 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-sm font-medium transition-colors"
              >
                Enable Pro for testing
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
