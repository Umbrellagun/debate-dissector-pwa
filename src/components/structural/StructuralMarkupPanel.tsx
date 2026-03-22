import React, { useState } from 'react';
import { 
  STRUCTURAL_MARKUPS, 
  STRUCTURAL_MARKUP_CATEGORIES, 
  getCategoryLabel,
  StructuralMarkup 
} from '../../data/structuralMarkup';

// Markup statistics from document content
export interface MarkupStats {
  [markupId: string]: number;
}

export type VerificationStatus = 'unverified' | 'verified' | 'disputed';

export interface SourceCitation {
  url?: string;
  author?: string;
  date?: string;
  publication?: string;
  verificationStatus?: VerificationStatus;
}

interface StructuralMarkupPanelProps {
  selectedMarkupId?: string | null;
  hasSelection?: boolean;
  onMarkupSelect?: (markup: StructuralMarkup) => void;
  onApplyMarkup?: (markup: StructuralMarkup, citation?: SourceCitation) => void;
  appliedMarkupIds?: string[]; // IDs of markups applied to current selection
  markupStats?: MarkupStats; // Count of each markup type in document
}

// Icon components for each markup type
const MarkupIcon: React.FC<{ type: string; className?: string }> = ({ type, className = "w-4 h-4" }) => {
  switch (type) {
    case 'claim':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'evidence':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'source-needed':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'unsupported':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      );
    case 'statistic':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'quote':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      );
    case 'anecdote':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
  }
};

export const StructuralMarkupPanel: React.FC<StructuralMarkupPanelProps> = ({
  selectedMarkupId,
  hasSelection = false,
  onMarkupSelect,
  onApplyMarkup,
  appliedMarkupIds = [],
  markupStats = {},
}) => {
  const totalMarkups = Object.values(markupStats).reduce((sum, count) => sum + count, 0);
  const sourceNeededCount = markupStats['source-needed'] || 0;
  const unsupportedCount = markupStats['unsupported'] || 0;
  const warningCount = sourceNeededCount + unsupportedCount;
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['assertions', 'support', 'flags']);
  const [showCitationForm, setShowCitationForm] = useState(false);
  const [citation, setCitation] = useState<SourceCitation>({});

  // Markup types that can have citations
  const citableMarkups = ['evidence', 'statistic', 'quote'];

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getMarkupsForCategory = (category: keyof typeof STRUCTURAL_MARKUP_CATEGORIES) => {
    const ids = STRUCTURAL_MARKUP_CATEGORIES[category];
    return STRUCTURAL_MARKUPS.filter(m => ids.includes(m.id));
  };

  const selectedMarkup = selectedMarkupId 
    ? STRUCTURAL_MARKUPS.find(m => m.id === selectedMarkupId) 
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-14 px-4 border-b border-gray-200 flex items-center justify-between shrink-0">
        <h3 className="font-medium text-gray-900">Claims & Evidence</h3>
        {totalMarkups > 0 && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {totalMarkups} total
          </span>
        )}
      </div>

      {/* Warning Summary - shows if there are items needing attention */}
      {warningCount > 0 && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
          <div className="flex items-center gap-2 text-amber-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium">Attention Needed</span>
          </div>
          <div className="mt-1 text-xs text-amber-700 space-y-1">
            {sourceNeededCount > 0 && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{sourceNeededCount} item{sourceNeededCount !== 1 ? 's' : ''} need sources</span>
              </div>
            )}
            {unsupportedCount > 0 && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>{unsupportedCount} unsupported assertion{unsupportedCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category List */}
      <div className="flex-1 overflow-y-auto">
        {(Object.keys(STRUCTURAL_MARKUP_CATEGORIES) as Array<keyof typeof STRUCTURAL_MARKUP_CATEGORIES>).map(category => (
          <div key={category} className="border-b border-gray-100">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                {getCategoryLabel(category)}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedCategories.includes(category) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Markup Items */}
            {expandedCategories.includes(category) && (
              <div className="pb-2">
                {getMarkupsForCategory(category).map(markup => {
                  const isApplied = appliedMarkupIds.includes(markup.id);
                  const isSelected = selectedMarkupId === markup.id;
                  
                  return (
                    <button
                      key={markup.id}
                      onClick={() => onMarkupSelect?.(markup)}
                      className={`w-full px-4 py-2 flex items-center gap-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-gray-100'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className="flex items-center justify-center w-6 h-6 rounded"
                        style={{ backgroundColor: `${markup.color}20`, color: markup.color }}
                      >
                        <MarkupIcon type={markup.id} className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {markup.name}
                          </span>
                          {isApplied && (
                            <span 
                              className="px-1.5 py-0.5 text-xs font-medium rounded"
                              style={{ backgroundColor: `${markup.color}20`, color: markup.color }}
                            >
                              Applied
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {markupStats[markup.id] > 0 && (
                          <span 
                            className="text-xs font-medium px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${markup.color}15`, color: markup.color }}
                          >
                            {markupStats[markup.id]}
                          </span>
                        )}
                        {markup.shortcut && (
                          <span className="text-xs text-gray-400 font-mono">
                            {markup.shortcut}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Markup Detail */}
      {selectedMarkup && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 shrink-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className="flex items-center justify-center w-8 h-8 rounded"
                style={{ backgroundColor: `${selectedMarkup.color}20`, color: selectedMarkup.color }}
              >
                <MarkupIcon type={selectedMarkup.id} className="w-5 h-5" />
              </span>
              <h4 className="font-semibold text-gray-900">{selectedMarkup.name}</h4>
            </div>
            <button
              onClick={() => onMarkupSelect?.(null as unknown as StructuralMarkup)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Close details"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">{selectedMarkup.description}</p>
          
          {/* Citation form for evidence types */}
          {citableMarkups.includes(selectedMarkup.id) && (
            <div className="mb-3">
              <button
                onClick={() => setShowCitationForm(!showCitationForm)}
                className="w-full text-xs text-left px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded flex items-center gap-2 mb-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="flex-1">{showCitationForm ? 'Hide source citation' : 'Add source citation'}</span>
                <svg className={`w-3 h-3 transition-transform ${showCitationForm ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showCitationForm && (
                <div className="space-y-2 p-2 bg-white rounded border border-gray-200">
                  <input
                    type="url"
                    placeholder="Source URL"
                    value={citation.url || ''}
                    onChange={(e) => setCitation(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Author"
                    value={citation.author || ''}
                    onChange={(e) => setCitation(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Publication"
                      value={citation.publication || ''}
                      onChange={(e) => setCitation(prev => ({ ...prev, publication: e.target.value }))}
                      className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Date"
                      value={citation.date || ''}
                      onChange={(e) => setCitation(prev => ({ ...prev, date: e.target.value }))}
                      className="w-20 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  {/* Verification Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Status:</span>
                    <div className="flex gap-1">
                      {(['unverified', 'verified', 'disputed'] as VerificationStatus[]).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setCitation(prev => ({ ...prev, verificationStatus: status }))}
                          className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                            citation.verificationStatus === status
                              ? status === 'verified'
                                ? 'bg-green-100 text-green-700 ring-1 ring-green-500'
                                : status === 'disputed'
                                ? 'bg-red-100 text-red-700 ring-1 ring-red-500'
                                : 'bg-gray-100 text-gray-700 ring-1 ring-gray-500'
                              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          {status === 'verified' && '✓ '}
                          {status === 'disputed' && '✗ '}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={() => {
              const hasCitation = Object.values(citation).some(v => v);
              onApplyMarkup?.(selectedMarkup, hasCitation ? citation : undefined);
              setCitation({});
              setShowCitationForm(false);
            }}
            disabled={!hasSelection}
            className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              hasSelection
                ? 'text-white hover:opacity-90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            style={hasSelection ? { backgroundColor: selectedMarkup.color } : undefined}
          >
            {hasSelection 
              ? (appliedMarkupIds.includes(selectedMarkup.id) ? 'Remove Markup' : 'Apply Markup')
              : 'Select text to apply'
            }
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 shrink-0">
        <p className="text-xs text-gray-500 mb-1">
          Select text to mark claims, evidence, or flag unsupported assertions.
        </p>
        <p className="text-xs text-gray-400">
          <span className="font-medium">Shortcuts:</span> Alt+C (Claim), Alt+E (Evidence), Alt+S (Source Needed)
        </p>
      </div>
    </div>
  );
};

export default StructuralMarkupPanel;
