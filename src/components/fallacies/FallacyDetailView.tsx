import React from 'react';
import { Fallacy, FALLACY_CATEGORY_NAMES } from '../../models';

interface FallacyDetailViewProps {
  fallacy: Fallacy | null;
  onClose?: () => void;
  onApply?: (fallacy: Fallacy) => void;
}

export const FallacyDetailView: React.FC<FallacyDetailViewProps> = ({
  fallacy,
  onClose,
  onApply,
}) => {
  if (!fallacy) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: fallacy.color }}
            />
            <h3 className="font-semibold text-gray-900">{fallacy.name}</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
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
          )}
        </div>

        <span className="inline-block px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-200 rounded mb-3">
          {FALLACY_CATEGORY_NAMES[fallacy.category]}
        </span>

        <p className="text-sm text-gray-700 mb-4">{fallacy.description}</p>

        {fallacy.examples && fallacy.examples.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Examples
            </h4>
            <ul className="space-y-2">
              {fallacy.examples.map((example, index) => (
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

        {onApply && (
          <button
            onClick={() => onApply(fallacy)}
            className="w-full py-2 px-4 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ backgroundColor: fallacy.color }}
          >
            Apply/Remove from Selected Text
          </button>
        )}
      </div>
    </div>
  );
};
