import React, { useState } from 'react';
import { Fallacy } from '../../models';
import { Rhetoric } from '../../models';
import { FallacyPanel } from './FallacyPanel';
import { RhetoricPanel } from './RhetoricPanel';

type TabType = 'fallacies' | 'rhetoric';

interface AnnotationPanelProps {
  fallacies: Fallacy[];
  rhetoric: Rhetoric[];
  onFallacySelect?: (fallacy: Fallacy) => void;
  onFallacyApply?: (fallacy: Fallacy) => void;
  selectedFallacyId?: string;
  onRhetoricSelect?: (rhetoric: Rhetoric) => void;
  onRhetoricApply?: (rhetoric: Rhetoric) => void;
  selectedRhetoricId?: string;
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
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('fallacies');

  return (
    <div className="h-full flex flex-col">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('fallacies')}
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
            activeTab === 'fallacies'
              ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          Fallacies
        </button>
        <button
          onClick={() => setActiveTab('rhetoric')}
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
            activeTab === 'rhetoric'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          Rhetoric
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'fallacies' ? (
          <FallacyPanel
            fallacies={fallacies}
            onFallacySelect={onFallacySelect}
            onFallacyApply={onFallacyApply}
            selectedFallacyId={selectedFallacyId}
          />
        ) : (
          <RhetoricPanel
            rhetoric={rhetoric}
            onRhetoricSelect={onRhetoricSelect}
            onRhetoricApply={onRhetoricApply}
            selectedRhetoricId={selectedRhetoricId}
          />
        )}
      </div>
    </div>
  );
};
