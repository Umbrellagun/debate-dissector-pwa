import React from 'react';
import { Fallacy } from '../../models';

interface AnnotationPopupProps {
  position: { top: number; left: number } | null;
  selectedFallacy: Fallacy | null;
  onApply: () => void;
  onCancel: () => void;
  visible: boolean;
}

export const AnnotationPopup: React.FC<AnnotationPopupProps> = ({
  position,
  selectedFallacy,
  onApply,
  onCancel,
  visible,
}) => {
  if (!visible || !position || !selectedFallacy) {
    return null;
  }

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]"
      style={{
        top: position.top + 8,
        left: position.left,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: selectedFallacy.color }}
        />
        <span className="font-medium text-sm text-gray-900">
          {selectedFallacy.name}
        </span>
      </div>
      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
        {selectedFallacy.description}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onApply}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-white rounded"
          style={{ backgroundColor: selectedFallacy.color }}
        >
          Apply
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
