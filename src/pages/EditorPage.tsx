import React, { useState, useCallback } from 'react';
import { Descendant } from 'slate';
import { MainLayout, Header } from '../components/layout';
import { DebateEditor } from '../components/editor';
import { FallacyPanel } from '../components/fallacies';
import { Fallacy } from '../models';
import { FALLACIES } from '../data/fallacies';

export const EditorPage: React.FC = () => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedFallacy, setSelectedFallacy] = useState<Fallacy | null>(null);
  const [documentContent, setDocumentContent] = useState<Descendant[]>([
    { type: 'paragraph', children: [{ text: '' }] },
  ]);

  const handleFallacySelect = useCallback((fallacy: Fallacy) => {
    setSelectedFallacy(fallacy);
  }, []);

  const handleContentChange = useCallback((value: Descendant[]) => {
    setDocumentContent(value);
  }, []);

  return (
    <MainLayout
      showSidebar={showSidebar}
      sidebar={
        <FallacyPanel
          fallacies={FALLACIES}
          onFallacySelect={handleFallacySelect}
          selectedFallacyId={selectedFallacy?.id}
        />
      }
    >
      <Header
        title="Untitled Debate"
        onMenuClick={() => setShowSidebar(!showSidebar)}
        actions={
          <div className="flex items-center gap-2">
            {selectedFallacy && (
              <span
                className="px-2 py-1 text-xs font-medium rounded"
                style={{
                  backgroundColor: selectedFallacy.color,
                  color: '#fff',
                }}
              >
                {selectedFallacy.name}
              </span>
            )}
          </div>
        }
      />
      <div className="flex-1 overflow-hidden bg-white">
        <DebateEditor
          initialValue={documentContent}
          onChange={handleContentChange}
          placeholder="Start typing or paste debate text here. Select text and click a fallacy to annotate it."
        />
      </div>
    </MainLayout>
  );
};
