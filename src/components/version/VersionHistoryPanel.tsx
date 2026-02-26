import React, { useState, useEffect } from 'react';
import { DocumentVersion } from '../../models';
import { getVersions, deleteVersion } from '../../services/storage';

// Inline SVG icons
const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

const RotateCcwIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

interface VersionHistoryPanelProps {
  documentId: string;
  onRestore: (version: DocumentVersion) => void;
  onClose: () => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  documentId,
  onRestore,
  onClose,
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);

  useEffect(() => {
    loadVersions();
  }, [documentId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const versionList = await getVersions(documentId);
      setVersions(versionList);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!window.confirm('Delete this version? This cannot be undone.')) {
      return;
    }
    
    await deleteVersion(versionId);
    await loadVersions();
    if (selectedVersion?.id === versionId) {
      setSelectedVersion(null);
    }
  };

  const handleRestore = (version: DocumentVersion) => {
    if (!window.confirm('Restore this version? Your current changes will be saved as a new version first.')) {
      return;
    }
    onRestore(version);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const extractPreview = (version: DocumentVersion): string => {
    let text = '';
    const extractText = (nodes: unknown[]): void => {
      for (const node of nodes) {
        if (text.length >= 100) break;
        const n = node as { text?: string; children?: unknown[] };
        if (n.text) {
          text += n.text;
        } else if (n.children) {
          extractText(n.children);
        }
      }
    };
    extractText(version.content);
    return text.slice(0, 100) + (text.length > 100 ? '...' : '');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <HistoryIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No version history yet</p>
              <p className="text-sm mt-1">Versions are automatically saved every 5 minutes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedVersion?.id === version.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900">
                          {formatDate(version.timestamp)}
                        </span>
                        {version.label && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            {version.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {version.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {extractPreview(version)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(version);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Restore this version"
                      >
                        <RotateCcwIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(version.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Delete this version"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            Versions are automatically saved every 5 minutes. Up to 50 versions are kept.
          </p>
        </div>
      </div>
    </div>
  );
};
