import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentListItem } from '../../models';

interface EditorLeftSidebarProps {
  onNewDocument?: () => void;
  documents: DocumentListItem[];
  currentDocumentId?: string;
  onDocumentSelect: (id: string) => void;
}

export const EditorLeftSidebar: React.FC<EditorLeftSidebarProps> = ({
  onNewDocument,
  documents,
  currentDocumentId,
  onDocumentSelect,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const query = searchQuery.toLowerCase();
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search debates..."
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewDocument}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Debate
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {searchQuery ? 'Search Results' : 'Recent Debates'}
          </h3>
          {filteredDocuments.length === 0 ? (
            <p className="px-2 py-2 text-sm text-gray-400">
              {searchQuery ? 'No matching debates' : 'No saved debates'}
            </p>
          ) : (
            <div className="space-y-1 mt-1">
              {filteredDocuments.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onDocumentSelect(doc.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    doc.id === currentDocumentId
                      ? 'bg-blue-100 text-blue-900'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium truncate">{doc.title || 'Untitled'}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>{formatDate(doc.updatedAt)}</span>
                    {doc.annotationCount > 0 && (
                      <span className="bg-gray-200 px-1.5 py-0.5 rounded">
                        {doc.annotationCount} annotation{doc.annotationCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          App Settings
        </button>
      </div>
    </div>
  );
};
