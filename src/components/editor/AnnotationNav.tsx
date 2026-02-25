import React, { useMemo } from 'react';
import { useSlate } from 'slate-react';
import { CustomEditor } from './types';
import { countAnnotationsByFallacy, selectNextAnnotation, selectPreviousAnnotation } from './utils';
import { Fallacy } from '../../models';

interface AnnotationNavProps {
  fallacies: Fallacy[];
  filterFallacyId?: string;
  onFilterChange?: (fallacyId: string | undefined) => void;
}

export const AnnotationNav: React.FC<AnnotationNavProps> = ({
  fallacies,
  filterFallacyId,
  onFilterChange,
}) => {
  const editor = useSlate() as CustomEditor;

  const annotationCounts = useMemo(() => {
    return countAnnotationsByFallacy(editor);
  }, [editor.children]);

  const totalAnnotations = useMemo(() => {
    return Object.values(annotationCounts).reduce((sum, count) => sum + count, 0);
  }, [annotationCounts]);

  const annotatedFallacies = useMemo(() => {
    return fallacies.filter((f) => annotationCounts[f.id] > 0);
  }, [fallacies, annotationCounts]);

  const handlePrevious = () => {
    selectPreviousAnnotation(editor, filterFallacyId);
  };

  const handleNext = () => {
    selectNextAnnotation(editor, filterFallacyId);
  };

  if (totalAnnotations === 0) {
    return (
      <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200">
        No annotations yet. Select text and apply a fallacy to annotate.
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700">
            {totalAnnotations} annotation{totalAnnotations !== 1 ? 's' : ''}
          </span>
          {filterFallacyId && (
            <button
              onClick={() => onFilterChange?.(undefined)}
              className="text-xs text-blue-600 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevious}
            className="p-1 rounded hover:bg-gray-200"
            title="Previous annotation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="p-1 rounded hover:bg-gray-200"
            title="Next annotation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {annotatedFallacies.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {annotatedFallacies.map((fallacy) => (
            <button
              key={fallacy.id}
              onClick={() => onFilterChange?.(filterFallacyId === fallacy.id ? undefined : fallacy.id)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full transition-colors ${
                filterFallacyId === fallacy.id
                  ? 'ring-2 ring-offset-1 ring-gray-400'
                  : 'hover:opacity-80'
              }`}
              style={{ backgroundColor: fallacy.color, color: '#fff' }}
            >
              <span>{fallacy.name}</span>
              <span className="bg-white/30 px-1 rounded">
                {annotationCounts[fallacy.id]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
