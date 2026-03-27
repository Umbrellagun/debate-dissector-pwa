import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Fallacy, FALLACY_CATEGORY_NAMES } from '../../models';
import { Rhetoric, RHETORIC_CATEGORY_NAMES } from '../../models';
import { FallacyPanel } from './FallacyPanel';
import { RhetoricPanel } from './RhetoricPanel';
import { StructuralPanel } from './StructuralPanel';
import { StructuralMarkup, getStructuralMarkupById } from '../../data/structuralMarkup';
import { SourceCitation } from '../structural';
import { useApp } from '../../context';
import { useAnalytics } from '../../hooks/useAnalytics';
import { HiddenAnnotationIds } from '../editor/VisibilityControls';

export type AnnotationTabType = 'fallacies' | 'rhetoric' | 'structural';

// Chevron icon for dropdown
const ChevronIcon: React.FC<{ expanded: boolean; className?: string }> = ({
  expanded,
  className,
}) => (
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
  structuralClickNonce?: number;
  activeTab?: AnnotationTabType;
  onTabChange?: (tab: AnnotationTabType) => void;
  hiddenAnnotationIds?: HiddenAnnotationIds;
  onToggleFallacyVisibility?: (id: string) => void;
  onToggleRhetoricVisibility?: (id: string) => void;
  onToggleStructuralVisibility?: (id: string) => void;
  onBulkToggleFallacies?: (hide: boolean) => void;
  onBulkToggleRhetoric?: (hide: boolean) => void;
  onBulkToggleStructural?: (hide: boolean) => void;
  onShowAllAnnotations?: () => void;
  onBulkToggleFallacyIds?: (ids: string[], hide: boolean) => void;
  onBulkToggleRhetoricIds?: (ids: string[], hide: boolean) => void;
  onBulkToggleStructuralIds?: (ids: string[], hide: boolean) => void;
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
  structuralClickNonce = 0,
  activeTab: controlledTab,
  onTabChange: _onTabChange,
  hiddenAnnotationIds = { fallacyIds: [], rhetoricIds: [], structuralIds: [] },
  onToggleFallacyVisibility,
  onToggleRhetoricVisibility,
  onToggleStructuralVisibility,
  onBulkToggleFallacies,
  onBulkToggleRhetoric,
  onBulkToggleStructural,
  onShowAllAnnotations: _onShowAllAnnotations,
  onBulkToggleFallacyIds,
  onBulkToggleRhetoricIds,
  onBulkToggleStructuralIds,
}) => {
  const {
    state: { preferences },
    updatePreferences,
  } = useApp();
  const { trackEvent } = useAnalytics();

  const [searchQuery, setSearchQuery] = useState('');
  const [fallaciesExpanded, setFallaciesExpanded] = useState(preferences.fallaciesExpanded ?? true);
  const [rhetoricExpanded, setRhetoricExpanded] = useState(preferences.rhetoricExpanded ?? true);
  const [structuralExpanded, setStructuralExpanded] = useState(
    preferences.structuralExpanded ?? true
  );
  const [showHint, setShowHint] = useState(!(preferences.annotationHintDismissed ?? false));
  const [showCitationForm, setShowCitationForm] = useState(false);
  const [citation, setCitation] = useState<SourceCitation>({});
  const [lastPopulatedKey, setLastPopulatedKey] = useState<string | null>(null);
  const isInitializing = useRef(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const isFormFocused = useRef(false);
  const hasUserEdited = useRef(false);

  // Create a unique key for the current annotation using the click nonce
  const getAnnotationKey = (id: string | undefined) => {
    if (!id) return null;
    return `${id}:${structuralClickNonce}`;
  };

  // Pre-populate citation form when a DIFFERENT annotation is selected
  useEffect(() => {
    const currentKey = getAnnotationKey(selectedStructuralId);
    if (currentKey !== lastPopulatedKey) {
      // Cancel any pending auto-save from previous annotation
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      isFormFocused.current = false;
      isInitializing.current = true;
      setLastPopulatedKey(currentKey);
      if (selectedStructuralMetadata) {
        const hasData = Object.values(selectedStructuralMetadata).some(v => v);
        setCitation({
          url: selectedStructuralMetadata.url,
          author: selectedStructuralMetadata.author,
          date: selectedStructuralMetadata.date,
          publication: selectedStructuralMetadata.publication,
          verificationStatus: selectedStructuralMetadata.verificationStatus,
        });
        // Auto-expand the citation form if there's existing data
        if (hasData) {
          setShowCitationForm(true);
        }
      } else {
        setCitation({});
      }
      // Reset initializing flag after a tick and clear user edit flag
      hasUserEdited.current = false;
      setTimeout(() => {
        isInitializing.current = false;
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStructuralId, selectedStructuralMetadata, structuralClickNonce, lastPopulatedKey]);

  // Auto-save citation changes with debounce - only when user has edited
  useEffect(() => {
    // Skip auto-save if user hasn't edited, during initialization, or if no markup selected
    if (!hasUserEdited.current || isInitializing.current || !selectedStructuralId) return;

    const selectedStructural = getStructuralMarkupById(selectedStructuralId);
    if (!selectedStructural) return;

    // Clear existing timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    // Debounce auto-save by 500ms
    autoSaveTimer.current = setTimeout(() => {
      const hasCitation = Object.values(citation).some(v => v);
      if (hasCitation) {
        // Save citation data
        onStructuralApply?.(selectedStructural, citation);
      } else {
        // User cleared all fields - save empty to remove citation
        onStructuralApply?.(selectedStructural, {
          url: '',
          author: '',
          date: '',
          publication: '',
          verificationStatus: undefined,
        });
      }
    }, 500);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [citation, selectedStructuralId, onStructuralApply]);

  // Markup types that can have citations
  const citableMarkups = ['evidence', 'statistic', 'quote'];

  // Clear citation form when metadata is absent (clicked away or selected non-sourced markup)
  useEffect(() => {
    if (!selectedStructuralMetadata || !Object.values(selectedStructuralMetadata).some(v => v)) {
      if (!hasUserEdited.current) {
        setCitation({});
        setShowCitationForm(false);
      }
    }
  }, [selectedStructuralMetadata]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledTab, selectedFallacyId, selectedRhetoricId, selectedStructuralId]);

  return (
    <div className="h-full flex flex-col">
      {/* Unified Search Bar */}
      <div className="h-14 px-4 border-b border-gray-200 flex items-center shrink-0">
        <input
          type="text"
          placeholder="Search annotations..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search annotations"
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
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
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
            <div className="flex items-center gap-1">
              {onBulkToggleFallacies && (
                <span
                  onClick={e => {
                    e.stopPropagation();
                    onBulkToggleFallacies(hiddenAnnotationIds.fallacyIds.length === 0);
                  }}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    hiddenAnnotationIds.fallacyIds.length > 0
                      ? 'bg-orange-100 hover:bg-orange-200'
                      : 'hover:bg-red-200'
                  }`}
                  title={
                    hiddenAnnotationIds.fallacyIds.length > 0
                      ? `Show all (${hiddenAnnotationIds.fallacyIds.length} hidden)`
                      : 'Hide all fallacies'
                  }
                  role="button"
                  aria-label={
                    hiddenAnnotationIds.fallacyIds.length > 0
                      ? 'Show all fallacies'
                      : 'Hide all fallacies'
                  }
                >
                  {hiddenAnnotationIds.fallacyIds.length > 0 ? (
                    <svg
                      className="w-4 h-4 text-orange-600"
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
                      className="w-4 h-4 text-red-400"
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
              )}
              <ChevronIcon expanded={fallaciesExpanded} className="w-5 h-5 text-red-600" />
            </div>
          </button>
          {fallaciesExpanded && (
            <div
              id="fallacies-panel"
              className="border-b border-gray-200"
              role="region"
              aria-label="Fallacies list"
            >
              <FallacyPanel
                fallacies={fallacies}
                onFallacySelect={onFallacySelect}
                onFallacyApply={onFallacyApply}
                selectedFallacyId={selectedFallacyId}
                searchQuery={searchQuery}
                hiddenIds={hiddenAnnotationIds.fallacyIds}
                onToggleVisibility={onToggleFallacyVisibility}
                onBulkToggle={onBulkToggleFallacyIds}
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
            <div className="flex items-center gap-1">
              {onBulkToggleRhetoric && (
                <span
                  onClick={e => {
                    e.stopPropagation();
                    onBulkToggleRhetoric(hiddenAnnotationIds.rhetoricIds.length === 0);
                  }}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    hiddenAnnotationIds.rhetoricIds.length > 0
                      ? 'bg-orange-100 hover:bg-orange-200'
                      : 'hover:bg-blue-200'
                  }`}
                  title={
                    hiddenAnnotationIds.rhetoricIds.length > 0
                      ? `Show all (${hiddenAnnotationIds.rhetoricIds.length} hidden)`
                      : 'Hide all rhetoric'
                  }
                  role="button"
                  aria-label={
                    hiddenAnnotationIds.rhetoricIds.length > 0
                      ? 'Show all rhetoric'
                      : 'Hide all rhetoric'
                  }
                >
                  {hiddenAnnotationIds.rhetoricIds.length > 0 ? (
                    <svg
                      className="w-4 h-4 text-orange-600"
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
                      className="w-4 h-4 text-blue-400"
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
              )}
              <ChevronIcon expanded={rhetoricExpanded} className="w-5 h-5 text-blue-600" />
            </div>
          </button>
          {rhetoricExpanded && (
            <div
              id="rhetoric-panel"
              className="border-b border-gray-200"
              role="region"
              aria-label="Rhetoric list"
            >
              <RhetoricPanel
                rhetoric={rhetoric}
                onRhetoricSelect={onRhetoricSelect}
                onRhetoricApply={onRhetoricApply}
                selectedRhetoricId={selectedRhetoricId}
                searchQuery={searchQuery}
                hiddenIds={hiddenAnnotationIds.rhetoricIds}
                onToggleVisibility={onToggleRhetoricVisibility}
                onBulkToggle={onBulkToggleRhetoricIds}
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
            <div className="flex items-center gap-1">
              {onBulkToggleStructural && (
                <span
                  onClick={e => {
                    e.stopPropagation();
                    onBulkToggleStructural(hiddenAnnotationIds.structuralIds.length === 0);
                  }}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    hiddenAnnotationIds.structuralIds.length > 0
                      ? 'bg-orange-100 hover:bg-orange-200'
                      : 'hover:bg-purple-200'
                  }`}
                  title={
                    hiddenAnnotationIds.structuralIds.length > 0
                      ? `Show all (${hiddenAnnotationIds.structuralIds.length} hidden)`
                      : 'Hide all structural'
                  }
                  role="button"
                  aria-label={
                    hiddenAnnotationIds.structuralIds.length > 0
                      ? 'Show all structural'
                      : 'Hide all structural'
                  }
                >
                  {hiddenAnnotationIds.structuralIds.length > 0 ? (
                    <svg
                      className="w-4 h-4 text-orange-600"
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
                      className="w-4 h-4 text-purple-400"
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
              )}
              <ChevronIcon expanded={structuralExpanded} className="w-5 h-5 text-purple-600" />
            </div>
          </button>
          {structuralExpanded && (
            <div
              id="structural-panel"
              className="border-b border-gray-200"
              role="region"
              aria-label="Claims and evidence list"
            >
              <StructuralPanel
                onStructuralSelect={onStructuralSelect}
                onStructuralApply={onStructuralApply}
                selectedStructuralId={selectedStructuralId}
                searchQuery={searchQuery}
                hiddenIds={hiddenAnnotationIds.structuralIds}
                onToggleVisibility={onToggleStructuralVisibility}
                onBulkToggle={onBulkToggleStructuralIds}
              />
            </div>
          )}
        </div>
      </div>

      {/* Detail View - Fixed at bottom, outside scrollable area */}
      {selectedFallacyId &&
        (() => {
          const selectedFallacy = fallacies.find(f => f.id === selectedFallacyId);
          if (!selectedFallacy) return null;
          const isPinned = preferences.pinnedFallacies?.includes(selectedFallacy.id);
          const isFallacyHidden = hiddenAnnotationIds.fallacyIds.includes(selectedFallacy.id);
          const handleTogglePin = () => {
            const current = preferences.pinnedFallacies || [];
            const updated = isPinned
              ? current.filter(id => id !== selectedFallacy.id)
              : [...current, selectedFallacy.id];
            updatePreferences({ pinnedFallacies: updated });
            trackEvent(isPinned ? 'annotation_unpinned' : 'annotation_pinned', {
              type: 'fallacy',
              id: selectedFallacy.id,
              name: selectedFallacy.name,
            });
          };
          return (
            <div className="border-t border-gray-200 bg-gray-50 p-4 flex-shrink-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: isFallacyHidden ? '#d1d5db' : selectedFallacy.color }}
                  />
                  <h3
                    className={`font-semibold ${isFallacyHidden ? 'text-gray-400' : 'text-gray-900'}`}
                  >
                    {selectedFallacy.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleTogglePin}
                    className={`p-1.5 rounded transition-colors ${isPinned ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-200 text-gray-400'}`}
                    aria-label={isPinned ? 'Unpin from toolbar' : 'Pin to toolbar'}
                    title={isPinned ? 'Unpin from toolbar' : 'Pin to toolbar'}
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill={isPinned ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M12 17v5M9 3h6a2 2 0 012 2v4l2 2v2H5v-2l2-2V5a2 2 0 012-2z" />
                    </svg>
                  </button>
                  {onToggleFallacyVisibility && (
                    <button
                      onClick={() => onToggleFallacyVisibility(selectedFallacy.id)}
                      className={`p-1.5 rounded transition-colors ${isFallacyHidden ? 'bg-orange-100 text-orange-500' : 'hover:bg-gray-200 text-emerald-500'}`}
                      aria-label={
                        isFallacyHidden
                          ? `Show ${selectedFallacy.name} in editor`
                          : `Hide ${selectedFallacy.name} in editor`
                      }
                      title={isFallacyHidden ? 'Show in editor' : 'Hide in editor'}
                    >
                      {isFallacyHidden ? (
                        <svg
                          className="w-4 h-4"
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
                          className="w-4 h-4"
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
                  <button
                    onClick={() => onFallacySelect?.(null as unknown as Fallacy)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    aria-label="Close details"
                  >
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
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
                      <li
                        key={index}
                        className="text-sm text-gray-600 italic bg-white p-2 rounded border border-gray-200"
                      >
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

      {selectedRhetoricId &&
        !selectedFallacyId &&
        (() => {
          const selectedRhetoric = rhetoric.find(r => r.id === selectedRhetoricId);
          if (!selectedRhetoric) return null;
          const isPinned = preferences.pinnedRhetoric?.includes(selectedRhetoric.id);
          const isRhetoricHidden = hiddenAnnotationIds.rhetoricIds.includes(selectedRhetoric.id);
          const handleTogglePin = () => {
            const current = preferences.pinnedRhetoric || [];
            const updated = isPinned
              ? current.filter(id => id !== selectedRhetoric.id)
              : [...current, selectedRhetoric.id];
            updatePreferences({ pinnedRhetoric: updated });
            trackEvent(isPinned ? 'annotation_unpinned' : 'annotation_pinned', {
              type: 'rhetoric',
              id: selectedRhetoric.id,
              name: selectedRhetoric.name,
            });
          };
          return (
            <div className="border-t border-gray-200 bg-blue-50 p-4 flex-shrink-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{
                      backgroundColor: isRhetoricHidden ? '#d1d5db' : selectedRhetoric.color,
                    }}
                  />
                  <h3
                    className={`font-semibold ${isRhetoricHidden ? 'text-gray-400' : 'text-gray-900'}`}
                  >
                    {selectedRhetoric.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleTogglePin}
                    className={`p-1.5 rounded transition-colors ${isPinned ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-200 text-gray-400'}`}
                    aria-label={isPinned ? 'Unpin from toolbar' : 'Pin to toolbar'}
                    title={isPinned ? 'Unpin from toolbar' : 'Pin to toolbar'}
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill={isPinned ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M12 17v5M9 3h6a2 2 0 012 2v4l2 2v2H5v-2l2-2V5a2 2 0 012-2z" />
                    </svg>
                  </button>
                  {onToggleRhetoricVisibility && (
                    <button
                      onClick={() => onToggleRhetoricVisibility(selectedRhetoric.id)}
                      className={`p-1.5 rounded transition-colors ${isRhetoricHidden ? 'bg-orange-100 text-orange-500' : 'hover:bg-gray-200 text-emerald-500'}`}
                      aria-label={
                        isRhetoricHidden
                          ? `Show ${selectedRhetoric.name} in editor`
                          : `Hide ${selectedRhetoric.name} in editor`
                      }
                      title={isRhetoricHidden ? 'Show in editor' : 'Hide in editor'}
                    >
                      {isRhetoricHidden ? (
                        <svg
                          className="w-4 h-4"
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
                          className="w-4 h-4"
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
                  <button
                    onClick={() => onRhetoricSelect?.(null as unknown as Rhetoric)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    aria-label="Close details"
                  >
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
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

      {selectedStructuralId &&
        !selectedFallacyId &&
        !selectedRhetoricId &&
        (() => {
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
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-700 mb-3">{selectedStructural.description}</p>
              {selectedStructural.shortcut && (
                <p className="text-xs text-gray-500 mb-3">
                  Keyboard shortcut:{' '}
                  <span className="font-mono bg-gray-100 px-1 rounded">
                    Alt+{selectedStructural.shortcut}
                  </span>
                </p>
              )}

              {/* Citation form for evidence types */}
              {isCitable && (
                <div className="mb-3">
                  <button
                    onClick={() => setShowCitationForm(!showCitationForm)}
                    className="w-full text-xs text-left px-2 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded flex items-center gap-2 mb-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    <span className="flex-1">
                      {showCitationForm ? 'Hide source citation' : 'Add source citation (optional)'}
                    </span>
                    <svg
                      className={`w-3 h-3 transition-transform ${showCitationForm ? 'rotate-180' : ''}`}
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

                  {showCitationForm && (
                    <div className="space-y-2 p-2 bg-white rounded border border-gray-200">
                      <input
                        type="url"
                        placeholder="Source URL"
                        value={citation.url || ''}
                        onChange={e => {
                          hasUserEdited.current = true;
                          setCitation(prev => ({ ...prev, url: e.target.value }));
                        }}
                        onFocus={() => {
                          isFormFocused.current = true;
                        }}
                        onBlur={() => {
                          isFormFocused.current = false;
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        placeholder="Author"
                        value={citation.author || ''}
                        onChange={e => {
                          hasUserEdited.current = true;
                          setCitation(prev => ({ ...prev, author: e.target.value }));
                        }}
                        onFocus={() => {
                          isFormFocused.current = true;
                        }}
                        onBlur={() => {
                          isFormFocused.current = false;
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        placeholder="Publication"
                        value={citation.publication || ''}
                        onChange={e => {
                          hasUserEdited.current = true;
                          setCitation(prev => ({ ...prev, publication: e.target.value }));
                        }}
                        onFocus={() => {
                          isFormFocused.current = true;
                        }}
                        onBlur={() => {
                          isFormFocused.current = false;
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        placeholder="Date (e.g., 2024-03-15)"
                        value={citation.date || ''}
                        onChange={e => {
                          hasUserEdited.current = true;
                          setCitation(prev => ({ ...prev, date: e.target.value }));
                        }}
                        onFocus={() => {
                          isFormFocused.current = true;
                        }}
                        onBlur={() => {
                          isFormFocused.current = false;
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <div className="flex items-center gap-1 pt-1">
                        <span className="text-xs text-gray-500 mr-1">Status:</span>
                        {(['unverified', 'verified', 'disputed'] as const).map(status => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              hasUserEdited.current = true;
                              setCitation(prev => ({ ...prev, verificationStatus: status }));
                            }}
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
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  onStructuralApply?.(selectedStructural);
                }}
                className="w-full py-2 px-4 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: selectedStructural.color }}
              >
                Apply/Remove {selectedStructural.name}
              </button>
            </div>
          );
        })()}
    </div>
  );
};
