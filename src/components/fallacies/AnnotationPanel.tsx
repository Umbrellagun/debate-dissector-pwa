import React, { useState, useEffect, useCallback } from 'react';
import { Fallacy, FALLACY_CATEGORY_NAMES } from '../../models';
import { Rhetoric, RHETORIC_CATEGORY_NAMES } from '../../models';
import { FallacyPanel } from './FallacyPanel';
import { RhetoricPanel } from './RhetoricPanel';
import { StructuralPanel } from './StructuralPanel';
import { StructuralMarkup, getStructuralMarkupById } from '../../data/structuralMarkup';
import { SourceCitation } from '../structural';
import { useApp } from '../../context';

export type AnnotationTabType = 'fallacies' | 'rhetoric' | 'structural';

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
  onStructuralSelect?: (markup: StructuralMarkup) => void;
  onStructuralApply?: (markup: StructuralMarkup, citation?: SourceCitation) => void;
  selectedStructuralId?: string;
  selectedStructuralMetadata?: SourceCitation;
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
  onStructuralSelect,
  onStructuralApply,
  selectedStructuralId,
  selectedStructuralMetadata,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const { state: { preferences }, updatePreferences } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [fallaciesExpanded, setFallaciesExpanded] = useState(preferences.fallaciesExpanded ?? true);
  const [rhetoricExpanded, setRhetoricExpanded] = useState(preferences.rhetoricExpanded ?? true);
  const [structuralExpanded, setStructuralExpanded] = useState(preferences.structuralExpanded ?? true);
  const [showHint, setShowHint] = useState(!(preferences.annotationHintDismissed ?? false));
  const [showCitationForm, setShowCitationForm] = useState(false);
  const [citation, setCitation] = useState<SourceCitation>({});
  
  // Pre-populate citation form when metadata is provided (clicking on existing annotation)
  useEffect(() => {
    if (selectedStructuralMetadata) {
      setCitation({
        url: selectedStructuralMetadata.url,
        author: selectedStructuralMetadata.author,
        date: selectedStructuralMetadata.date,
        publication: selectedStructuralMetadata.publication,
        verificationStatus: selectedStructuralMetadata.verificationStatus,
      });
    } else {
      setCitation({});
    }
  }, [selectedStructuralMetadata]);
  
  // Markup types that can have citations
  const citableMarkups = ['evidence', 'statistic', 'quote'];
  
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
  
  const handleStructuralToggle = useCallback(() => {
    const newValue = !structuralExpanded;
    setStructuralExpanded(newValue);
    updatePreferences({ structuralExpanded: newValue });
  }, [structuralExpanded, updatePreferences]);
  
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
    } else if (controlledTab === 'structural' && selectedStructuralId) {
      setStructuralExpanded(true);
      // Auto-expand citation form for citable markups when clicked from editor
      if (citableMarkups.includes(selectedStructuralId)) {
        setShowCitationForm(true);
      }
    }
  }, [controlledTab, selectedFallacyId, selectedRhetoricId, selectedStructuralId]);

  return (
    <div className="h-full flex flex-col">
      {/* Unified Search Bar */}
      <div className="h-14 px-4 border-b border-gray-200 flex items-center shrink-0">
        <input
          type="text"
          placeholder="Search annotations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search fallacies and rhetoric"
          role="searchbox"
        />
      </div>

      {/* Scrollable Content with Dropdowns */}
      <div className="flex-1 overflow-y-auto">
        {/* Dismissible Hint */}
        {showHint && (
          <div className="mx-3 mt-3 mb-2 p-3 bg-gray-100 rounded-lg flex items-start justify-between">
            <p className="text-sm text-gray-600">Select an annotation type to see details</p>
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
            aria-expanded={fallaciesExpanded}
            aria-controls="fallacies-panel"
          >
            <span className="font-medium text-red-700">Fallacies</span>
            <ChevronIcon expanded={fallaciesExpanded} className="w-5 h-5 text-red-600" />
          </button>
          {fallaciesExpanded && (
            <div id="fallacies-panel" className="border-b border-gray-200" role="region" aria-label="Fallacies list">
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
            aria-expanded={rhetoricExpanded}
            aria-controls="rhetoric-panel"
          >
            <span className="font-medium text-blue-700">Rhetoric</span>
            <ChevronIcon expanded={rhetoricExpanded} className="w-5 h-5 text-blue-600" />
          </button>
          {rhetoricExpanded && (
            <div id="rhetoric-panel" className="border-b border-gray-200" role="region" aria-label="Rhetoric list">
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

        {/* Claims & Evidence Dropdown */}
        <div>
          <button
            onClick={handleStructuralToggle}
            className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 transition-colors border-b border-purple-200 sticky top-[104px] z-10"
            aria-expanded={structuralExpanded}
            aria-controls="structural-panel"
          >
            <span className="font-medium text-purple-700">Claims & Evidence</span>
            <ChevronIcon expanded={structuralExpanded} className="w-5 h-5 text-purple-600" />
          </button>
          {structuralExpanded && (
            <div id="structural-panel" className="border-b border-gray-200" role="region" aria-label="Claims and evidence list">
              <StructuralPanel
                onStructuralSelect={onStructuralSelect}
                onStructuralApply={onStructuralApply}
                selectedStructuralId={selectedStructuralId}
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
        const isPinned = preferences.pinnedFallacies?.includes(selectedFallacy.id);
        const handleTogglePin = () => {
          const current = preferences.pinnedFallacies || [];
          const updated = isPinned
            ? current.filter(id => id !== selectedFallacy.id)
            : [...current, selectedFallacy.id];
          updatePreferences({ pinnedFallacies: updated });
        };
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
              <div className="flex items-center gap-1">
                <button
                  onClick={handleTogglePin}
                  className={`p-1.5 rounded transition-colors ${isPinned ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-200 text-gray-400'}`}
                  aria-label={isPinned ? 'Unpin from toolbar' : 'Pin to toolbar'}
                  title={isPinned ? 'Unpin from toolbar' : 'Pin to toolbar'}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                    <path d="M12 17v5M9 3h6a2 2 0 012 2v4l2 2v2H5v-2l2-2V5a2 2 0 012-2z" />
                  </svg>
                </button>
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
        const isPinned = preferences.pinnedRhetoric?.includes(selectedRhetoric.id);
        const handleTogglePin = () => {
          const current = preferences.pinnedRhetoric || [];
          const updated = isPinned
            ? current.filter(id => id !== selectedRhetoric.id)
            : [...current, selectedRhetoric.id];
          updatePreferences({ pinnedRhetoric: updated });
        };
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
              <div className="flex items-center gap-1">
                <button
                  onClick={handleTogglePin}
                  className={`p-1.5 rounded transition-colors ${isPinned ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-200 text-gray-400'}`}
                  aria-label={isPinned ? 'Unpin from toolbar' : 'Pin to toolbar'}
                  title={isPinned ? 'Unpin from toolbar' : 'Pin to toolbar'}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                    <path d="M12 17v5M9 3h6a2 2 0 012 2v4l2 2v2H5v-2l2-2V5a2 2 0 012-2z" />
                  </svg>
                </button>
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

      {selectedStructuralId && !selectedFallacyId && !selectedRhetoricId && (() => {
        const selectedStructural = getStructuralMarkupById(selectedStructuralId);
        if (!selectedStructural) return null;
        const isCitable = citableMarkups.includes(selectedStructural.id);
        return (
          <div className="border-t border-gray-200 bg-purple-50 p-4 flex-shrink-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: selectedStructural.color }}
                />
                <h3 className="font-semibold text-gray-900">{selectedStructural.name}</h3>
              </div>
              <button
                onClick={() => onStructuralSelect?.(null as unknown as StructuralMarkup)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label="Close details"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-3">{selectedStructural.description}</p>
            {selectedStructural.shortcut && (
              <p className="text-xs text-gray-500 mb-3">
                Keyboard shortcut: <span className="font-mono bg-gray-100 px-1 rounded">Alt+{selectedStructural.shortcut}</span>
              </p>
            )}
            
            {/* Citation form for evidence types */}
            {isCitable && (
              <div className="mb-3">
                <div className="text-xs text-purple-600 mb-2 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Add a source to strengthen this {selectedStructural.name.toLowerCase()}</span>
                </div>
                <button
                  onClick={() => setShowCitationForm(!showCitationForm)}
                  className="w-full text-xs text-left px-2 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded flex items-center gap-2 mb-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="flex-1">{showCitationForm ? 'Hide source citation' : 'Add source citation (optional)'}</span>
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
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Author"
                      value={citation.author || ''}
                      onChange={(e) => setCitation(prev => ({ ...prev, author: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Publication"
                      value={citation.publication || ''}
                      onChange={(e) => setCitation(prev => ({ ...prev, publication: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Date (e.g., 2024-03-15)"
                      value={citation.date || ''}
                      onChange={(e) => setCitation(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-1 pt-1">
                      <span className="text-xs text-gray-500 mr-1">Status:</span>
                      {(['unverified', 'verified', 'disputed'] as const).map(status => (
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
                                  : 'bg-gray-200 text-gray-700 ring-1 ring-gray-400'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    {/* Helper text */}
                    <p className="text-xs text-gray-500 italic pt-1">
                      Click the button below to apply with source info
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={() => {
                const hasCitation = Object.values(citation).some(v => v);
                onStructuralApply?.(selectedStructural, hasCitation ? citation : undefined);
                setCitation({});
                setShowCitationForm(false);
              }}
              className="w-full py-2 px-4 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: selectedStructural.color }}
            >
              {showCitationForm && Object.values(citation).some(v => v) 
                ? `Apply ${selectedStructural.name} with Source`
                : 'Apply/Remove from Selected Text'}
            </button>
          </div>
        );
      })()}
    </div>
  );
};
