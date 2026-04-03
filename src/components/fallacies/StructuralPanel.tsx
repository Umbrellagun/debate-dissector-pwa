import React, { useState, useMemo } from 'react';
import {
  STRUCTURAL_MARKUPS,
  STRUCTURAL_MARKUP_CATEGORIES,
  getCategoryLabel,
  StructuralMarkup,
} from '../../data/structuralMarkup';
import { useApp } from '../../context';

interface StructuralPanelProps {
  onStructuralSelect?: (markup: StructuralMarkup) => void;
  onStructuralApply?: (markup: StructuralMarkup) => void;
  selectedStructuralId?: string;
  searchQuery?: string;
  hiddenIds?: string[];
  onToggleVisibility?: (id: string) => void;
  onBulkToggle?: (ids: string[], hide: boolean) => void;
}

// Icon components for each markup type
const MarkupIcon: React.FC<{ type: string; className?: string }> = ({
  type,
  className = 'w-4 h-4',
}) => {
  switch (type) {
    case 'claim':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      );
    case 'evidence':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'source-needed':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    case 'unsupported':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      );
    case 'statistic':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      );
  }
};

export const StructuralPanel: React.FC<StructuralPanelProps> = ({
  onStructuralSelect,
  onStructuralApply: _onStructuralApply,
  selectedStructuralId,
  searchQuery = '',
  hiddenIds = [],
  onToggleVisibility,
  onBulkToggle,
}) => {
  const {
    state: { preferences },
    updatePreferences,
  } = useApp();

  const initialCategories = preferences.expandedStructuralCategories ?? ['assertions', 'support'];
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(initialCategories)
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      updatePreferences({ expandedStructuralCategories: Array.from(next) });
      return next;
    });
  };

  const filteredMarkups = useMemo(() => {
    if (!searchQuery) return STRUCTURAL_MARKUPS;
    return STRUCTURAL_MARKUPS.filter(
      m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const getMarkupsForCategory = (category: keyof typeof STRUCTURAL_MARKUP_CATEGORIES) => {
    const ids = STRUCTURAL_MARKUP_CATEGORIES[category];
    return filteredMarkups.filter(m => ids.includes(m.id));
  };

  return (
    <div className="flex flex-col">
      {(
        Object.keys(STRUCTURAL_MARKUP_CATEGORIES) as Array<
          keyof typeof STRUCTURAL_MARKUP_CATEGORIES
        >
      ).map(category => {
        const markups = getMarkupsForCategory(category);
        if (markups.length === 0) return null;

        return (
          <div key={category}>
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              aria-expanded={expandedCategories.has(category)}
            >
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {getCategoryLabel(category)}
              </span>
              <div className="flex items-center gap-1">
                {onBulkToggle &&
                  markups.length > 0 &&
                  (() => {
                    const catIds = markups.map(m => m.id);
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
                  className={`w-4 h-4 text-gray-400 transition-transform ${
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
              <div className="pb-1">
                {markups.map(markup => {
                  const isHidden = hiddenIds.includes(markup.id);
                  return (
                    <div
                      key={markup.id}
                      className={`flex items-center ${selectedStructuralId === markup.id ? 'bg-purple-50' : ''}`}
                    >
                      <button
                        onClick={() => onStructuralSelect?.(markup)}
                        className={`flex-1 px-4 py-2 flex items-center gap-3 text-left transition-colors ${
                          selectedStructuralId === markup.id ? '' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className="flex items-center justify-center w-6 h-6 rounded"
                          style={{
                            backgroundColor: isHidden
                              ? '#f3f4f6'
                              : `${preferences.customColors?.[markup.id] || markup.color}20`,
                            color: isHidden
                              ? '#9ca3af'
                              : preferences.customColors?.[markup.id] || markup.color,
                          }}
                        >
                          <MarkupIcon type={markup.id} className="w-4 h-4" />
                        </span>
                        <span
                          className={`text-sm flex-1 ${isHidden ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                        >
                          {markup.name}
                        </span>
                        {markup.shortcut && (
                          <span className="text-xs text-gray-400 font-mono">
                            Alt+{markup.shortcut}
                          </span>
                        )}
                      </button>
                      {onToggleVisibility && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onToggleVisibility(markup.id);
                          }}
                          className="p-1.5 mr-2 rounded hover:bg-gray-200 transition-colors"
                          title={isHidden ? 'Show in editor' : 'Hide in editor'}
                          aria-label={
                            isHidden
                              ? `Show ${markup.name} in editor`
                              : `Hide ${markup.name} in editor`
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
  );
};

export default StructuralPanel;
