import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Descendant } from 'slate';
import { MainLayout, Header } from '../components/layout';
import { DebateEditor, DebateEditorHandle, applyFallacyMark, applyRhetoricMark, EditorLeftSidebar, DEFAULT_INITIAL_VALUE } from '../components/editor';
import { AnnotationPanel } from '../components/fallacies';
import { Fallacy, Rhetoric, Annotation, DebateDocument, DocumentListItem } from '../models';
import { FALLACIES } from '../data/fallacies';
import { RHETORIC_TECHNIQUES } from '../data/rhetoric';
import { useApp } from '../context';

// Extract unique fallacy and rhetoric IDs from document content
const extractUsedAnnotations = (content: Descendant[]): { fallacyIds: string[]; rhetoricIds: string[] } => {
  const fallacyIds = new Set<string>();
  const rhetoricIds = new Set<string>();
  
  const traverse = (nodes: Descendant[]) => {
    for (const node of nodes) {
      if ('text' in node) {
        const textNode = node as { fallacyMarks?: { fallacyId: string }[]; rhetoricMarks?: { rhetoricId: string }[] };
        if (textNode.fallacyMarks) {
          textNode.fallacyMarks.forEach(m => fallacyIds.add(m.fallacyId));
        }
        if (textNode.rhetoricMarks) {
          textNode.rhetoricMarks.forEach(m => rhetoricIds.add(m.rhetoricId));
        }
      }
      if ('children' in node && Array.isArray((node as { children: Descendant[] }).children)) {
        traverse((node as { children: Descendant[] }).children);
      }
    }
  };
  
  traverse(content);
  return { fallacyIds: Array.from(fallacyIds), rhetoricIds: Array.from(rhetoricIds) };
};

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
  const [selectedRhetoric, setSelectedRhetoric] = useState<Rhetoric | null>(null);
  const [currentDoc, setCurrentDoc] = useState<DebateDocument | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Extract used annotations from current document content
  const { usedFallacies, usedRhetoric } = useMemo(() => {
    if (!currentDoc?.content) {
      return { usedFallacies: [], usedRhetoric: [] };
    }
    const { fallacyIds, rhetoricIds } = extractUsedAnnotations(currentDoc.content);
    const usedFallacies = fallacyIds
      .map(id => FALLACIES.find(f => f.id === id))
      .filter((f): f is Fallacy => f !== undefined);
    const usedRhetoric = rhetoricIds
      .map(id => RHETORIC_TECHNIQUES.find(r => r.id === id))
      .filter((r): r is Rhetoric => r !== undefined);
    return { usedFallacies, usedRhetoric };
  }, [currentDoc?.content]);

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
    setSelectedRhetoric(null); // Clear rhetoric selection when fallacy is selected
  }, []);

  const handleRhetoricSelect = useCallback((rhetoric: Rhetoric | null) => {
    setSelectedRhetoric(rhetoric);
    setSelectedFallacy(null); // Clear fallacy selection when rhetoric is selected
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

  const handleRhetoricApply = useCallback((rhetoric: Rhetoric) => {
    const editor = editorRef.current?.getEditor();
    if (!editor || !currentDoc) return;

    const result = applyRhetoricMark(editor, rhetoric.id, rhetoric.color);
    if (result) {
      // Rhetoric marks are stored in the editor content, no separate annotation needed
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
        <AnnotationPanel
          fallacies={FALLACIES}
          rhetoric={RHETORIC_TECHNIQUES}
          onFallacySelect={handleFallacySelect}
          onFallacyApply={handleFallacyApply}
          selectedFallacyId={selectedFallacy?.id}
          onRhetoricSelect={handleRhetoricSelect}
          onRhetoricApply={handleRhetoricApply}
          selectedRhetoricId={selectedRhetoric?.id}
        />
      }
      rightSidebarExpanded={rightSidebarExpanded}
      onRightSidebarToggle={() => setRightSidebarExpanded(!rightSidebarExpanded)}
    >
      <Header
        onMenuClick={() => setShowLeftSidebar(!showLeftSidebar)}
        titleElement={
          <input
            type="text"
            value={currentDoc.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Debate"
            className="w-full text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400"
          />
        }
        actions={
          <div className="flex items-center gap-4 flex-wrap">
            {usedFallacies.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-red-600 font-medium mr-1">Fallacies:</span>
                {usedFallacies.map(f => (
                  <span
                    key={f.id}
                    className="px-2 py-1 text-xs font-medium rounded"
                    style={{
                      backgroundColor: f.color,
                      color: '#fff',
                    }}
                  >
                    {f.name}
                  </span>
                ))}
              </div>
            )}
            {usedRhetoric.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-blue-600 font-medium mr-1">Rhetoric:</span>
                {usedRhetoric.map(r => (
                  <span
                    key={r.id}
                    className="px-2 py-1 text-xs font-medium rounded"
                    style={{
                      backgroundColor: r.color,
                      color: '#fff',
                    }}
                  >
                    {r.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        }
      />
      <div className="flex-1 overflow-hidden bg-white flex flex-col">
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
