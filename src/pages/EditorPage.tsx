import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Descendant, Editor, Range } from 'slate';
import { MainLayout, Header } from '../components/layout';
import { DebateEditor, DebateEditorHandle, applyFallacyMark, applyRhetoricMark, clearAllAnnotations, EditorLeftSidebar, DEFAULT_INITIAL_VALUE } from '../components/editor';
import { AnnotationPanel, AnnotationTabType } from '../components/fallacies';
import { VersionHistoryPanel } from '../components/version';
import { Fallacy, Rhetoric, Annotation, DebateDocument, DocumentListItem, DocumentVersion } from '../models';
import { FALLACIES } from '../data/fallacies';
import { RHETORIC_TECHNIQUES } from '../data/rhetoric';
import { EXAMPLE_DOCUMENT_TITLE, EXAMPLE_DOCUMENT_CONTENT } from '../data/exampleDocument';
import { useApp } from '../context';
import { saveDocument as saveDoc, createVersion } from '../services/storage';

// Simple SVG icon component for History
const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

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
  const { state, loadDocument, loadDocuments, createDocument, saveDocument, deleteDocument, updatePreferences } = useApp();
  const { documents, preferences, isLoading } = state;

  const editorRef = useRef<DebateEditorHandle>(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(true);
  const [sidebarStatesSynced, setSidebarStatesSynced] = useState(false);
  const [selectedFallacy, setSelectedFallacy] = useState<Fallacy | null>(null);
  const [selectedRhetoric, setSelectedRhetoric] = useState<Rhetoric | null>(null);
  const [currentDoc, setCurrentDoc] = useState<DebateDocument | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [annotationTab, setAnnotationTab] = useState<AnnotationTabType>('fallacies');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [hasTextSelection, setHasTextSelection] = useState(false);
  
  // Sync sidebar states from preferences once loaded
  useEffect(() => {
    if (!isLoading && !sidebarStatesSynced) {
      setShowLeftSidebar(preferences.leftSidebarOpen ?? false);
      setRightSidebarExpanded(preferences.rightSidebarOpen ?? true);
      setSidebarStatesSynced(true);
    }
  }, [isLoading, sidebarStatesSynced, preferences.leftSidebarOpen, preferences.rightSidebarOpen]);

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
      // Load all documents for the sidebar and get fresh list
      const freshDocs = await loadDocuments();

      let doc: DebateDocument | null = null;

      if (id) {
        doc = await loadDocument(id);
      } else if (preferences.lastEditedDocumentId) {
        doc = await loadDocument(preferences.lastEditedDocumentId);
      }

      if (!doc) {
        // Check if this is a first-time user (no documents exist)
        const isFirstTime = freshDocs.length === 0;
        if (isFirstTime) {
          // Create example document with pre-marked fallacies
          doc = await createDocument(EXAMPLE_DOCUMENT_TITLE, EXAMPLE_DOCUMENT_CONTENT);
        } else {
          doc = await createDocument('Untitled Debate');
        }
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

  const handleLeftSidebarToggle = useCallback(() => {
    const newValue = !showLeftSidebar;
    setShowLeftSidebar(newValue);
    updatePreferences({ leftSidebarOpen: newValue });
  }, [showLeftSidebar, updatePreferences]);

  const handleRightSidebarToggle = useCallback(() => {
    const newValue = !rightSidebarExpanded;
    setRightSidebarExpanded(newValue);
    updatePreferences({ rightSidebarOpen: newValue });
  }, [rightSidebarExpanded, updatePreferences]);

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

  const handleClearAnnotations = useCallback(() => {
    const editor = editorRef.current?.getEditor();
    if (!editor) return;
    clearAllAnnotations(editor);
  }, []);

  const handleSelectionChange = useCallback(() => {
    const editor = editorRef.current?.getEditor();
    if (!editor || !editor.selection) {
      setHasTextSelection(false);
      return;
    }
    
    // Check if there's actual text selected (not just a cursor position)
    const isTextSelected = !Range.isCollapsed(editor.selection);
    setHasTextSelection(isTextSelected);
    
    // Get the leaf node at the current selection point
    const [start] = Range.edges(editor.selection);
    
    try {
      const [node] = Editor.node(editor, start);
      const leaf = node as { 
        text?: string;
        fallacyMarks?: { fallacyId: string; appliedAt?: number }[]; 
        rhetoricMarks?: { rhetoricId: string; appliedAt?: number }[] 
      };
      
      if (!leaf || typeof leaf.text !== 'string') return;
      
      const fallacyMarks = leaf.fallacyMarks || [];
      const rhetoricMarks = leaf.rhetoricMarks || [];
      const hasFallacy = fallacyMarks.length > 0;
      const hasRhetoric = rhetoricMarks.length > 0;
      
      // Find the most recently applied annotation across both types
      const lastFallacy = hasFallacy ? fallacyMarks[fallacyMarks.length - 1] : null;
      const lastRhetoric = hasRhetoric ? rhetoricMarks[rhetoricMarks.length - 1] : null;
      
      // Determine which was applied last (matches displayed color)
      let selectFallacy = false;
      let selectRhetoric = false;
      
      if (lastFallacy && lastRhetoric) {
        // Both exist - use whichever was applied last
        if ((lastFallacy.appliedAt || 0) > (lastRhetoric.appliedAt || 0)) {
          selectFallacy = true;
        } else {
          selectRhetoric = true;
        }
      } else if (lastFallacy) {
        selectFallacy = true;
      } else if (lastRhetoric) {
        selectRhetoric = true;
      }
      
      // Switch tab and select the most recent annotation
      if (selectRhetoric && lastRhetoric) {
        setAnnotationTab('rhetoric');
        const rhetoric = RHETORIC_TECHNIQUES.find(r => r.id === lastRhetoric.rhetoricId);
        if (rhetoric) {
          setSelectedRhetoric(rhetoric);
        }
      } else if (selectFallacy && lastFallacy) {
        setAnnotationTab('fallacies');
        const fallacy = FALLACIES.find(f => f.id === lastFallacy.fallacyId);
        if (fallacy) {
          setSelectedFallacy(fallacy);
        }
      }
    } catch {
      // Selection might be at an invalid point, ignore
    }
  }, []);

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

  const handleDocumentDelete = useCallback(async (docId: string) => {
    await deleteDocument(docId);
    
    // If we deleted the current document, switch to another one
    if (docId === currentDoc?.id) {
      const remainingDocs = documents.filter(d => d.id !== docId);
      if (remainingDocs.length > 0) {
        const nextDoc = await loadDocument(remainingDocs[0].id);
        if (nextDoc) {
          setCurrentDoc(nextDoc);
          await updatePreferences({ lastEditedDocumentId: nextDoc.id });
          navigate(`/editor/${nextDoc.id}`);
        }
      } else {
        // No documents left, create a new one
        const newDoc = await createDocument('Untitled Debate');
        setCurrentDoc(newDoc);
        await updatePreferences({ lastEditedDocumentId: newDoc.id });
        navigate(`/editor/${newDoc.id}`);
      }
    }
  }, [currentDoc?.id, documents, deleteDocument, loadDocument, createDocument, updatePreferences, navigate]);

  const handleVersionRestore = useCallback(async (version: DocumentVersion) => {
    if (!currentDoc) return;
    
    // Save current state as a version first
    await createVersion(currentDoc, 'Before restore');
    
    // Restore the selected version's content
    const restoredDoc: DebateDocument = {
      ...currentDoc,
      title: version.title,
      content: version.content,
      annotations: version.annotations,
      updatedAt: Date.now(),
    };
    
    setCurrentDoc(restoredDoc);
    await saveDoc(restoredDoc, true); // Force create a version
    setShowVersionHistory(false);
  }, [currentDoc]);

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
      onLeftSidebarClose={() => setShowLeftSidebar(false)}
      leftSidebar={
        <EditorLeftSidebar
          onNewDocument={handleNewDocument}
          documents={documents}
          currentDocumentId={currentDoc.id}
          onDocumentSelect={handleDocumentSelect}
          onDocumentDelete={handleDocumentDelete}
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
          activeTab={annotationTab}
          onTabChange={setAnnotationTab}
        />
      }
      rightSidebarExpanded={rightSidebarExpanded}
      onRightSidebarToggle={handleRightSidebarToggle}
    >
      <Header
        onMenuClick={handleLeftSidebarToggle}
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
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Annotation tags - hidden on small screens */}
            <div className="hidden md:flex items-center gap-4 flex-wrap">
              {usedFallacies.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-red-600 font-medium mr-1">Fallacies:</span>
                  {usedFallacies.map(f => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setAnnotationTab('fallacies');
                        setSelectedFallacy(f);
                        if (!rightSidebarExpanded) setRightSidebarExpanded(true);
                      }}
                      className="px-2 py-1 text-xs font-medium rounded cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: f.color,
                        color: '#fff',
                      }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
              {usedRhetoric.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-blue-600 font-medium mr-1">Rhetoric:</span>
                  {usedRhetoric.map(r => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setAnnotationTab('rhetoric');
                        setSelectedRhetoric(r);
                        if (!rightSidebarExpanded) setRightSidebarExpanded(true);
                      }}
                      className="px-2 py-1 text-xs font-medium rounded cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: r.color,
                        color: '#fff',
                      }}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Version history - shown first on mobile for better UX */}
            <button
              onClick={() => setShowVersionHistory(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              title="Version History"
            >
              <HistoryIcon className="w-5 h-5" />
            </button>
            {/* Annotation panel toggle - visible on mobile */}
            <button
              onClick={handleRightSidebarToggle}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              title="Annotations"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </button>
          </div>
        }
      />
      <div className="flex-1 overflow-hidden bg-white flex flex-col relative">
        <div className="flex-1 overflow-hidden">
          <DebateEditor
            key={currentDoc.id}
            ref={editorRef}
            initialValue={normalizeEditorContent(currentDoc.content)}
            onChange={handleContentChange}
            onSelectionChange={handleSelectionChange}
            onFallacyClick={(fallacyId) => {
              const fallacy = FALLACIES.find(f => f.id === fallacyId);
              if (fallacy) {
                setAnnotationTab('fallacies');
                setSelectedFallacy(fallacy);
              }
            }}
            onRhetoricClick={(rhetoricId) => {
              const rhetoric = RHETORIC_TECHNIQUES.find(r => r.id === rhetoricId);
              if (rhetoric) {
                setAnnotationTab('rhetoric');
                setSelectedRhetoric(rhetoric);
              }
            }}
            placeholder="Start typing or paste debate text here. Select text and click a fallacy to annotate it."
          />
        </div>
        
        {/* Floating Apply/Remove Button - visible on mobile when text is selected and annotation is chosen */}
        {hasTextSelection && (selectedFallacy || selectedRhetoric) && (
          <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <button
              onClick={() => {
                if (selectedFallacy) {
                  handleFallacyApply(selectedFallacy);
                } else if (selectedRhetoric) {
                  handleRhetoricApply(selectedRhetoric);
                }
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-full shadow-lg touch-manipulation font-medium text-white"
              style={{
                backgroundColor: selectedFallacy?.color || selectedRhetoric?.color || '#3b82f6',
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>Apply {selectedFallacy?.name || selectedRhetoric?.name}</span>
            </button>
          </div>
        )}
      </div>
      
      {showVersionHistory && (
        <VersionHistoryPanel
          documentId={currentDoc.id}
          onRestore={handleVersionRestore}
          onClose={() => setShowVersionHistory(false)}
        />
      )}
    </MainLayout>
  );
};
