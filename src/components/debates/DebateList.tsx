import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentListItem } from '../../models';

interface DebateListProps {
  documents: DocumentListItem[];
  onDelete?: (id: string) => void;
}

export const DebateList: React.FC<DebateListProps> = ({ documents, onDelete }) => {
  const navigate = useNavigate();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No debates yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new debate analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => navigate(`/editor/${doc.id}`)}
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {doc.title || 'Untitled'}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500">
                {formatDate(doc.updatedAt)}
              </span>
              {doc.annotationCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {doc.annotationCount} annotation{doc.annotationCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(doc.id);
              }}
              className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
