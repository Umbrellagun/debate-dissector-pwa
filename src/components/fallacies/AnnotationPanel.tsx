import React, { useState, useEffect, useCallback } from 'react';
import { Fallacy, FALLACY_CATEGORY_NAMES } from '../../models';
import { Rhetoric, RHETORIC_CATEGORY_NAMES } from '../../models';
import { FallacyPanel } from './FallacyPanel';
import { RhetoricPanel } from './RhetoricPanel';
import { useApp } from '../../context';

export type AnnotationTabType = 'fallacies' | 'rhetoric';

// Chevron icon for dropdown
const ChevronIcon: React.FC<{ expanded: boolean; className?: string }> = ({ expanded, className }) => (
  <svg 
    className={`${className} transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

interface AnnotationPanelProps {
  fallacies: Fallacy[];
  rhetoric: Rhetoric[];
  onFallacySelect?: (fallacy: Fallacy) => void;
  onFallacyApply?: (fallacy: Fallacy) => void;
  selectedFallacyId?: string;
  onRhetoricSelect?: (rhetoric: Rhetoric) => void;
  onRhetoricApply?: (rhetoric: Rhetoric) => void;
  selectedRhetoricId?: string;
  activeTab?: AnnotationTabType;
  onTabChange?: (tab: AnnotationTabType) => void;
}

export const AnnotationPanel: React.FC<AnnotationPanelProps> = ({
  fallacies,
  rhetoric,
  onFallacySelect,
  onFallacyApply,
  selectedFallacyId,
  onRhetoricSelect,
  onRhetoricApply,
  selectedRhetoricId,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const { state: { preferences }, updatePreferences } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [fallaciesExpanded, setFallaciesExpanded] = useState(preferences.fallaciesExpanded ?? true);
  const [rhetoricExpanded, setRhetoricExpanded] = useState(preferences.rhetoricExpanded ?? true);
  const [showHint, setShowHint] = useState(!(preferences.annotationHintDismissed ?? false));
  
  // Persist dropdown states to preferences
  const handleFallaciesToggle = useCallback(() => {
    const newValue = !fallaciesExpanded;
    setFallaciesExpanded(newValue);
    updatePreferences({ fallaciesExpanded: newValue });
  }, [fallaciesExpanded, updatePreferences]);
  
  const handleRhetoricToggle = useCallback(() => {
    const newValue = !rhetoricExpanded;
    setRhetoricExpanded(newValue);
    updatePreferences({ rhetoricExpanded: newValue });
  }, [rhetoricExpanded, updatePreferences]);
  
  const handleDismissHint = useCallback(() => {
    setShowHint(false);
    updatePreferences({ annotationHintDismissed: true });
  }, [updatePreferences]);
  
  // Auto-expand section when item is selected from external source (e.g., clicking annotation)
  useEffect(() => {
    if (controlledTab === 'fallacies' && selectedFallacyId) {
      setFallaciesExpanded(true);
    } else if (controlledTab === 'rhetoric' && selectedRhetoricId) {
      setRhetoricExpanded(true);
    }
  }, [controlledTab, selectedFallacyId, selectedRhetoricId]);

  return (
    <div className="h-full flex flex-col">
      {/* Unified Search Bar */}
      <div className="h-14 px-4 border-b border-gray-200 flex items-center shrink-0">
        <input
          type="text"
          placeholder="Search fallacies & rhetoric..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Scrollable Content with Dropdowns */}
      <div className="flex-1 overflow-y-auto">
        {/* Dismissible Hint */}
        {showHint && (
          <div className="mx-3 mt-3 mb-2 p-3 bg-gray-100 rounded-lg flex items-start justify-between">
            <p className="text-sm text-gray-600">Select fallacies or rhetoric to see its details</p>
            <button
              onClick={handleDismissHint}
              className="p-1 hover:bg-gray-200 rounded transition-colors ml-2 flex-shrink-0"
              aria-label="Dismiss hint"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Fallacies Dropdown */}
        <div>
          <button
            onClick={handleFallaciesToggle}
            className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 transition-colors border-b border-red-200 sticky top-0 z-10"
          >
            <span className="font-medium text-red-700">Fallacies</span>
            <ChevronIcon expanded={fallaciesExpanded} className="w-5 h-5 text-red-600" />
          </button>
          {fallaciesExpanded && (
            <div className="border-b border-gray-200">
              <FallacyPanel
                fallacies={fallacies}
                onFallacySelect={onFallacySelect}
                onFallacyApply={onFallacyApply}
                selectedFallacyId={selectedFallacyId}
                searchQuery={searchQuery}
              />
            </div>
          )}
        </div>

        {/* Rhetoric Dropdown */}
        <div>
          <button
            onClick={handleRhetoricToggle}
            className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors border-b border-blue-200 sticky top-[52px] z-10"
          >
            <span className="font-medium text-blue-700">Rhetoric</span>
            <ChevronIcon expanded={rhetoricExpanded} className="w-5 h-5 text-blue-600" />
          </button>
          {rhetoricExpanded && (
            <div className="border-b border-gray-200">
              <RhetoricPanel
                rhetoric={rhetoric}
                onRhetoricSelect={onRhetoricSelect}
                onRhetoricApply={onRhetoricApply}
                selectedRhetoricId={selectedRhetoricId}
                searchQuery={searchQuery}
              />
            </div>
          )}
        </div>
      </div>

      {/* Detail View - Fixed at bottom, outside scrollable area */}
      {selectedFallacyId && (() => {
        const selectedFallacy = fallacies.find(f => f.id === selectedFallacyId);
        if (!selectedFallacy) return null;
        return (
          <div className="border-t border-gray-200 bg-gray-50 p-4 flex-shrink-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: selectedFallacy.color }}
                />
                <h3 className="font-semibold text-gray-900">{selectedFallacy.name}</h3>
              </div>
              <button
                onClick={() => onFallacySelect?.(null as unknown as Fallacy)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label="Close details"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <span className="inline-block px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-200 rounded mb-3">
              {FALLACY_CATEGORY_NAMES[selectedFallacy.category]}
            </span>
            <p className="text-sm text-gray-700 mb-4">{selectedFallacy.description}</p>
            {selectedFallacy.examples && selectedFallacy.examples.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Examples</h4>
                <ul className="space-y-2">
                  {selectedFallacy.examples.map((example, index) => (
                    <li key={index} className="text-sm text-gray-600 italic bg-white p-2 rounded border border-gray-200">
                      "{example}"
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => onFallacyApply?.(selectedFallacy)}
              className="w-full py-2 px-4 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: selectedFallacy.color }}
            >
              Apply/Remove from Selected Text
            </button>
          </div>
        );
      })()}

      {selectedRhetoricId && !selectedFallacyId && (() => {
        const selectedRhetoric = rhetoric.find(r => r.id === selectedRhetoricId);
        if (!selectedRhetoric) return null;
        return (
          <div className="border-t border-gray-200 bg-blue-50 p-4 flex-shrink-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: selectedRhetoric.color }}
                />
                <h3 className="font-semibold text-gray-900">{selectedRhetoric.name}</h3>
              </div>
              <button
                onClick={() => onRhetoricSelect?.(null as unknown as Rhetoric)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label="Close details"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <span className="inline-block px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-200 rounded mb-3">
              {RHETORIC_CATEGORY_NAMES[selectedRhetoric.category]}
            </span>
            <p className="text-sm text-gray-700 mb-4">{selectedRhetoric.description}</p>
            {selectedRhetoric.examples && selectedRhetoric.examples.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Example</h4>
                <p className="text-sm text-gray-600 italic bg-white p-2 rounded border border-gray-200">
                  "{selectedRhetoric.examples[0]}"
                </p>
              </div>
            )}
            <button
              onClick={() => onRhetoricApply?.(selectedRhetoric)}
              className="w-full py-2 px-4 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: selectedRhetoric.color }}
            >
              Apply/Remove from Selected Text
            </button>
          </div>
        );
      })()}
    </div>
  );
};
