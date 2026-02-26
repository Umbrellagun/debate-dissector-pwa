import React, { useState, useCallback } from 'react';
import { Fallacy, FallacyCategory, FALLACY_CATEGORY_NAMES } from '../../models';
import { FallacyDetailView } from './FallacyDetailView';
import { useApp } from '../../context';

interface FallacyPanelProps {
  fallacies: Fallacy[];
  onFallacySelect?: (fallacy: Fallacy) => void;
  onFallacyApply?: (fallacy: Fallacy) => void;
  selectedFallacyId?: string;
  searchQuery?: string;
}

export const FallacyPanel: React.FC<FallacyPanelProps> = ({
  fallacies,
  onFallacySelect,
  onFallacyApply,
  selectedFallacyId,
  searchQuery: externalSearchQuery,
}) => {
  const { state: { preferences }, updatePreferences } = useApp();
  
  // Initialize from preferences
  const initialCategories = preferences.expandedFallacyCategories ?? ['informal', 'red-herring'];
  const [expandedCategories, setExpandedCategories] = useState<Set<FallacyCategory>>(
    new Set<FallacyCategory>(initialCategories as FallacyCategory[])
  );
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  
  // Use external search query if provided, otherwise use internal
  const searchQuery = externalSearchQuery ?? internalSearchQuery;
  const showInternalSearch = externalSearchQuery === undefined;

  const toggleCategory = useCallback((category: FallacyCategory) => {
    setExpandedCategories((prev) => {
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
  }, [updatePreferences]);

  const selectedFallacy = fallacies.find((f) => f.id === selectedFallacyId) || null;

  const filteredFallacies = fallacies.filter(
    (f) =>
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

  return (
    <div className="flex flex-col">
      {showInternalSearch && (
        <div className="p-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Fallacy Reference</h2>
          <input
            type="text"
            placeholder="Search fallacies..."
            value={internalSearchQuery}
            onChange={(e) => setInternalSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      <div>
        {(Object.keys(FALLACY_CATEGORY_NAMES) as FallacyCategory[]).map((category) => {
          const categoryFallacies = groupedFallacies[category] || [];
          if (categoryFallacies.length === 0 && searchQuery) return null;

          return (
            <div key={category} className="border-b border-gray-100">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-700">
                  {FALLACY_CATEGORY_NAMES[category]}
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
                <div className="pb-2">
                  {categoryFallacies.map((fallacy) => (
                    <button
                      key={fallacy.id}
                      onClick={() => onFallacySelect?.(fallacy)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                        selectedFallacyId === fallacy.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: fallacy.color }}
                      />
                      <span className="text-sm text-gray-800">{fallacy.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail View */}
      <FallacyDetailView
        fallacy={selectedFallacy}
        onClose={() => onFallacySelect?.(null as unknown as Fallacy)}
        onApply={onFallacyApply}
      />
    </div>
  );
};
