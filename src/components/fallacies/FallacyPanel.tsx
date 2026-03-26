import React, { useState, useCallback, useMemo } from 'react';
import { Fallacy, FallacyCategory, FALLACY_CATEGORY_NAMES } from '../../models';
import { useApp } from '../../context';

interface FallacyPanelProps {
  fallacies: Fallacy[];
  onFallacySelect?: (fallacy: Fallacy) => void;
  onFallacyApply?: (fallacy: Fallacy) => void;
  selectedFallacyId?: string;
  searchQuery?: string;
  hiddenIds?: string[];
  onToggleVisibility?: (id: string) => void;
  onBulkToggle?: (ids: string[], hide: boolean) => void;
}

export const FallacyPanel: React.FC<FallacyPanelProps> = ({
  fallacies,
  onFallacySelect,
  onFallacyApply: _onFallacyApply,
  selectedFallacyId,
  searchQuery: externalSearchQuery,
  hiddenIds = [],
  onToggleVisibility,
  onBulkToggle,
}) => {
  const {
    state: { preferences },
    updatePreferences,
  } = useApp();

  // Initialize from preferences
  const initialCategories = preferences.expandedFallacyCategories ?? ['informal', 'red-herring'];
  const [expandedCategories, setExpandedCategories] = useState<Set<FallacyCategory>>(
    new Set<FallacyCategory>(initialCategories as FallacyCategory[])
  );
  const [internalSearchQuery, setInternalSearchQuery] = useState('');

  // Use external search query if provided, otherwise use internal
  const searchQuery = externalSearchQuery ?? internalSearchQuery;
  const showInternalSearch = externalSearchQuery === undefined;

  const toggleCategory = useCallback(
    (category: FallacyCategory) => {
      setExpandedCategories(prev => {
        const next = new Set(prev);
        if (next.has(category)) {
          next.delete(category);
        } else {
          next.add(category);
        }
        // Persist to preferences
        updatePreferences({ expandedFallacyCategories: Array.from(next) });
        return next;
      });
    },
    [updatePreferences]
  );

  const filteredFallacies = fallacies.filter(
    f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedFallacies = filteredFallacies.reduce(
    (acc, fallacy) => {
      if (!acc[fallacy.category]) {
        acc[fallacy.category] = [];
      }
      acc[fallacy.category].push(fallacy);
      return acc;
    },
    {} as Record<FallacyCategory, Fallacy[]>
  );

  const searchResultsMessage = useMemo(() => {
    if (!searchQuery) return '';
    return `${filteredFallacies.length} fallac${filteredFallacies.length === 1 ? 'y' : 'ies'} found`;
  }, [searchQuery, filteredFallacies.length]);

  return (
    <div className="flex flex-col">
      {/* Screen reader announcement for search results */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {searchResultsMessage}
      </div>

      {showInternalSearch && (
        <div className="p-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Fallacy Reference</h2>
          <input
            type="text"
            placeholder="Search fallacies..."
            value={internalSearchQuery}
            onChange={e => setInternalSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search fallacies"
            role="searchbox"
          />
        </div>
      )}

      <div>
        {(Object.keys(FALLACY_CATEGORY_NAMES) as FallacyCategory[]).map(category => {
          const categoryFallacies = groupedFallacies[category] || [];
          if (categoryFallacies.length === 0 && searchQuery) return null;

          return (
            <div key={category} className="border-b border-gray-200">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-3 py-2 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100"
                aria-expanded={expandedCategories.has(category)}
                aria-controls={`fallacy-category-${category}`}
              >
                <span className="text-sm font-medium text-gray-700">
                  {FALLACY_CATEGORY_NAMES[category]}
                </span>
                <div className="flex items-center gap-1">
                  {onBulkToggle &&
                    categoryFallacies.length > 0 &&
                    (() => {
                      const catIds = categoryFallacies.map(f => f.id);
                      const allCatHidden = catIds.every(id => hiddenIds.includes(id));
                      return (
                        <span
                          onClick={e => {
                            e.stopPropagation();
                            onBulkToggle(catIds, !allCatHidden);
                          }}
                          className={`p-0.5 rounded transition-colors cursor-pointer ${
                            allCatHidden ? 'bg-orange-100 hover:bg-orange-200' : 'hover:bg-gray-200'
                          }`}
                          title={allCatHidden ? 'Show all in category' : 'Hide all in category'}
                          role="button"
                        >
                          {allCatHidden ? (
                            <svg
                              className="w-3.5 h-3.5 text-orange-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-3.5 h-3.5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </span>
                      );
                    })()}
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      expandedCategories.has(category) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {expandedCategories.has(category) && (
                <div
                  id={`fallacy-category-${category}`}
                  className="pb-2 bg-white border-l-2 border-gray-200 ml-2"
                  role="group"
                  aria-label={`${FALLACY_CATEGORY_NAMES[category]} fallacies`}
                >
                  {categoryFallacies.map(fallacy => {
                    const isHidden = hiddenIds.includes(fallacy.id);
                    return (
                      <div
                        key={fallacy.id}
                        className={`flex items-center ${selectedFallacyId === fallacy.id ? 'bg-blue-50' : ''}`}
                      >
                        <button
                          onClick={() => onFallacySelect?.(fallacy)}
                          className={`flex-1 px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: isHidden ? '#d1d5db' : fallacy.color }}
                            aria-hidden="true"
                          />
                          <span
                            className={`text-sm ${isHidden ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                          >
                            {fallacy.name}
                          </span>
                        </button>
                        {onToggleVisibility && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onToggleVisibility(fallacy.id);
                            }}
                            className="p-1.5 mr-2 rounded hover:bg-gray-200 transition-colors"
                            title={isHidden ? 'Show in editor' : 'Hide in editor'}
                            aria-label={
                              isHidden
                                ? `Show ${fallacy.name} in editor`
                                : `Hide ${fallacy.name} in editor`
                            }
                          >
                            {isHidden ? (
                              <svg
                                className="w-3.5 h-3.5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-3.5 h-3.5 text-emerald-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
