import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Descendant } from 'slate';
import { MainLayout, Header } from '../components/layout';
import { DebateEditor, DebateEditorHandle, applyFallacyMark, EditorLeftSidebar, DEFAULT_INITIAL_VALUE } from '../components/editor';
import { FallacyPanel } from '../components/fallacies';
import { Fallacy, Annotation, DebateDocument, DocumentListItem } from '../models';
import { FALLACIES } from '../data/fallacies';
import { useApp } from '../context';

// Validate and normalize editor content to ensure it's always valid for Slate
const normalizeEditorContent = (content: Descendant[] | undefined | null): Descendant[] => {
  if (!content || !Array.isArray(content) || content.length === 0) {
    return DEFAULT_INITIAL_VALUE;
  }
  // Ensure each element has valid children with text
  const isValid = content.every(node => {
    if (typeof node !== 'object' || node === null) return false;
    const element = node as { children?: unknown[] };
    if (!element.children || !Array.isArray(element.children) || element.children.length === 0) return false;
    return element.children.every(child => {
      const textNode = child as { text?: string };
      return typeof textNode.text === 'string';
    });
  });
  return isValid ? content : DEFAULT_INITIAL_VALUE;
};

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, loadDocument, loadDocuments, createDocument, saveDocument, updatePreferences } = useApp();
  const { documents, preferences, isLoading } = state;

  const editorRef = useRef<DebateEditorHandle>(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(true);
  const [selectedFallacy, setSelectedFallacy] = useState<Fallacy | null>(null);
  const [currentDoc, setCurrentDoc] = useState<DebateDocument | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isLoading || isInitialized) return;

    const initDocument = async () => {
      // Load all documents for the sidebar
      await loadDocuments();

      let doc: DebateDocument | null = null;

      if (id) {
        doc = await loadDocument(id);
      } else if (preferences.lastEditedDocumentId) {
        doc = await loadDocument(preferences.lastEditedDocumentId);
      }

      if (!doc) {
        doc = await createDocument('Untitled Debate');
      }

      setCurrentDoc(doc);
      await updatePreferences({ lastEditedDocumentId: doc.id });
      setIsInitialized(true);
    };

    initDocument();
  }, [id, isLoading, isInitialized, preferences.lastEditedDocumentId, loadDocument, loadDocuments, createDocument, updatePreferences]);

  const handleFallacySelect = useCallback((fallacy: Fallacy | null) => {
    setSelectedFallacy(fallacy);
  }, []);

  const handleFallacyApply = useCallback((fallacy: Fallacy) => {
    const editor = editorRef.current?.getEditor();
    if (!editor || !currentDoc) return;

    const result = applyFallacyMark(editor, fallacy.id, fallacy.color);
    if (result) {
      const annotationId = `ann_${Date.now()}`;
      const now = Date.now();
      const newAnnotation: Annotation = {
        id: annotationId,
        fallacyId: fallacy.id,
        fallacyCategory: fallacy.category,
        color: fallacy.color,
        createdAt: now,
        updatedAt: now,
      };
      setCurrentDoc((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          annotations: { ...prev.annotations, [annotationId]: newAnnotation },
        };
      });
    }
  }, [currentDoc]);

  const handleContentChange = useCallback((value: Descendant[]) => {
    setCurrentDoc((prev) => {
      if (!prev) return prev;
      return { ...prev, content: value, updatedAt: Date.now() };
    });
  }, []);

  const handleTitleChange = useCallback((title: string) => {
    setCurrentDoc((prev) => {
      if (!prev) return prev;
      return { ...prev, title, updatedAt: Date.now() };
    });
  }, []);

  const handleNewDocument = useCallback(async () => {
    const doc = await createDocument('Untitled Debate');
    setCurrentDoc(doc);
    await updatePreferences({ lastEditedDocumentId: doc.id });
    await loadDocuments(); // Refresh document list
    navigate(`/editor/${doc.id}`);
  }, [createDocument, updatePreferences, loadDocuments, navigate]);

  const handleDocumentSelect = useCallback(async (docId: string) => {
    if (docId === currentDoc?.id) return;
    const doc = await loadDocument(docId);
    if (doc) {
      setCurrentDoc(doc);
      await updatePreferences({ lastEditedDocumentId: doc.id });
      navigate(`/editor/${doc.id}`);
    }
  }, [currentDoc?.id, loadDocument, updatePreferences, navigate]);

  useEffect(() => {
    if (!currentDoc || !isInitialized) return;

    const timeoutId = setTimeout(() => {
      saveDocument(currentDoc);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [currentDoc, isInitialized, saveDocument]);

  if (isLoading || !isInitialized || !currentDoc) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      showLeftSidebar={showLeftSidebar}
      leftSidebar={
        <EditorLeftSidebar
          onNewDocument={handleNewDocument}
          documents={documents}
          currentDocumentId={currentDoc.id}
          onDocumentSelect={handleDocumentSelect}
        />
      }
      showRightSidebar={true}
      rightSidebar={
        <FallacyPanel
          fallacies={FALLACIES}
          onFallacySelect={handleFallacySelect}
          onFallacyApply={handleFallacyApply}
          selectedFallacyId={selectedFallacy?.id}
        />
      }
      rightSidebarExpanded={rightSidebarExpanded}
      onRightSidebarToggle={() => setRightSidebarExpanded(!rightSidebarExpanded)}
    >
      <Header
        title={currentDoc.title}
        onMenuClick={() => setShowLeftSidebar(!showLeftSidebar)}
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
      <div className="flex-1 overflow-hidden bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200">
          <input
            type="text"
            value={currentDoc.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Debate"
            className="w-full text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400"
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <DebateEditor
            key={currentDoc.id}
            ref={editorRef}
            initialValue={normalizeEditorContent(currentDoc.content)}
            onChange={handleContentChange}
            placeholder="Start typing or paste debate text here. Select text and click a fallacy to annotate it."
          />
        </div>
      </div>
    </MainLayout>
  );
};
