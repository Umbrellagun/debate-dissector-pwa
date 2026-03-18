import React, { useState, useCallback, useMemo } from 'react';
import { Rhetoric, RhetoricCategory, RHETORIC_CATEGORY_NAMES } from '../../models';
import { useApp } from '../../context';

interface RhetoricPanelProps {
  rhetoric: Rhetoric[];
  onRhetoricSelect?: (rhetoric: Rhetoric) => void;
  onRhetoricApply?: (rhetoric: Rhetoric) => void;
  selectedRhetoricId?: string;
  searchQuery?: string;
}

export const RhetoricPanel: React.FC<RhetoricPanelProps> = ({
  rhetoric,
  onRhetoricSelect,
  onRhetoricApply,
  selectedRhetoricId,
  searchQuery: externalSearchQuery,
}) => {
  const { state: { preferences }, updatePreferences } = useApp();
  
  // Initialize from preferences
  const initialCategories = preferences.expandedRhetoricCategories ?? ['ethos', 'pathos'];
  const [expandedCategories, setExpandedCategories] = useState<Set<RhetoricCategory>>(
    new Set<RhetoricCategory>(initialCategories as RhetoricCategory[])
  );
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  
  // Use external search query if provided, otherwise use internal
  const searchQuery = externalSearchQuery ?? internalSearchQuery;
  const showInternalSearch = externalSearchQuery === undefined;

  const toggleCategory = useCallback((category: RhetoricCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      // Persist to preferences
      updatePreferences({ expandedRhetoricCategories: Array.from(next) });
      return next;
    });
  }, [updatePreferences]);

  const filteredRhetoric = rhetoric.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedRhetoric = filteredRhetoric.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<RhetoricCategory, Rhetoric[]>
  );

  const searchResultsMessage = useMemo(() => {
    if (!searchQuery) return '';
    return `${filteredRhetoric.length} rhetoric item${filteredRhetoric.length === 1 ? '' : 's'} found`;
  }, [searchQuery, filteredRhetoric.length]);

  return (
    <div className="flex flex-col">
      {/* Screen reader announcement for search results */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {searchResultsMessage}
      </div>

      {showInternalSearch && (
        <div className="p-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Rhetoric Reference</h2>
          <input
            type="text"
            placeholder="Search rhetoric..."
            value={internalSearchQuery}
            onChange={(e) => setInternalSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search rhetoric"
            role="searchbox"
          />
        </div>
      )}

      <div>
        {(Object.keys(RHETORIC_CATEGORY_NAMES) as RhetoricCategory[]).map((category) => {
          const categoryRhetoric = groupedRhetoric[category] || [];
          if (categoryRhetoric.length === 0 && searchQuery) return null;

          return (
            <div key={category} className="border-b border-gray-200">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-3 py-2 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100"
                aria-expanded={expandedCategories.has(category)}
                aria-controls={`rhetoric-category-${category}`}
              >
                <span className="text-sm font-medium text-gray-700">
                  {RHETORIC_CATEGORY_NAMES[category]}
                </span>
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
              </button>

              {expandedCategories.has(category) && (
                <div id={`rhetoric-category-${category}`} className="pb-2 bg-white border-l-2 border-gray-200 ml-2" role="group" aria-label={`${RHETORIC_CATEGORY_NAMES[category]} rhetoric`}>
                  {categoryRhetoric.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onRhetoricSelect?.(item)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
                        selectedRhetoricId === item.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      />
                      <span className="text-sm text-gray-800">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
