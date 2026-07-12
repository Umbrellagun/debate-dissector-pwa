import React, { useState } from 'react';
import { Descendant } from 'slate';
import { Speaker, ArgumentLink } from '../../models/document';
import { ArgumentMapView } from './ArgumentMapView';
import { TreeView } from './TreeView';

export type MapViewMode = 'timeline' | 'tree' | 'sunburst';

export interface ArgumentMapContainerProps {
  content: Descendant[];
  speakers?: Speaker[];
  customColors?: Record<string, string>;
  argumentLinks?: ArgumentLink[];
  thesisMarkIds?: string[];
  onFallacyClick?: (fallacyId: string) => void;
  onRhetoricClick?: (rhetoricId: string) => void;
  onStructuralClick?: (markupId: string) => void;
  onCreateLink?: (
    sourceMarkId: string,
    targetMarkId: string,
    linkType: 'supports' | 'rebuts'
  ) => void;
  onDeleteLink?: (linkId: string) => void;
  onDeleteLinks?: (linkIds: string[]) => void;
  onToggleThesis?: (markId: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const ArgumentMapContainer: React.FC<ArgumentMapContainerProps> = props => {
  const [viewMode, setViewMode] = useState<MapViewMode>('timeline');

  const viewOptions: { value: MapViewMode; label: string; icon: React.ReactNode }[] = [
    {
      value: 'timeline',
      label: 'Timeline',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      ),
    },
    {
      value: 'tree',
      label: 'Tree',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
          />
        </svg>
      ),
    },
    {
      value: 'sunburst',
      label: 'Sunburst',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      id="argument-map-container"
      data-role="argument-map-container"
      className="flex-1 flex flex-col min-h-0 bg-gray-50"
    >
      {/* View mode switcher */}
      <div
        id="view-mode-switcher"
        data-role="view-mode-switcher"
        className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200"
      >
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {viewOptions.map(option => (
            <button
              key={option.value}
              id={`view-mode-btn-${option.value}`}
              data-role="view-mode-button"
              type="button"
              onClick={() => setViewMode(option.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === option.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* View content */}
      <div id="view-content-area" data-role="view-content" className="flex-1 flex flex-col min-h-0">
        {viewMode === 'timeline' && (
          <ArgumentMapView
            content={props.content}
            speakers={props.speakers}
            customColors={props.customColors}
            argumentLinks={props.argumentLinks}
            thesisMarkIds={props.thesisMarkIds}
            onFallacyClick={props.onFallacyClick}
            onRhetoricClick={props.onRhetoricClick}
            onStructuralClick={props.onStructuralClick}
            onCreateLink={props.onCreateLink}
            onDeleteLink={props.onDeleteLink}
            onToggleThesis={props.onToggleThesis}
            onUndo={props.onUndo}
            onRedo={props.onRedo}
            canUndo={props.canUndo}
            canRedo={props.canRedo}
          />
        )}
        {viewMode === 'tree' && (
          <TreeView
            content={props.content}
            speakers={props.speakers}
            customColors={props.customColors}
            argumentLinks={props.argumentLinks}
            thesisMarkIds={props.thesisMarkIds}
            onFallacyClick={props.onFallacyClick}
            onRhetoricClick={props.onRhetoricClick}
            onStructuralClick={props.onStructuralClick}
            onCreateLink={props.onCreateLink}
            onDeleteLink={props.onDeleteLink}
            onDeleteLinks={props.onDeleteLinks}
            onToggleThesis={props.onToggleThesis}
            onUndo={props.onUndo}
            onRedo={props.onRedo}
            canUndo={props.canUndo}
            canRedo={props.canRedo}
          />
        )}
        {viewMode === 'sunburst' && (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-500 mb-1">Sunburst View</h3>
              <p className="text-sm text-gray-400">Coming in Phase C</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
