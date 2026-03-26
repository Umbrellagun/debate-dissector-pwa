import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Descendant, Editor, Range, Transforms } from 'slate';
import { MainLayout, Header } from '../components/layout';
import {
  DebateEditor,
  DebateEditorHandle,
  applyFallacyMark,
  applyRhetoricMark,
  applyStructuralMark,
  applyCommentMark,
  removeCommentMark,
  getSelectionText,
  clearAllAnnotations,
  EditorLeftSidebar,
  DEFAULT_INITIAL_VALUE,
  PinnedAnnotation,
  assignSpeakerToSelection,
  HiddenAnnotationIds,
} from '../components/editor';
import { AnnotationPanel, AnnotationTabType } from '../components/fallacies';
import { SpeakerPanel } from '../components/speakers';
import { CommentPanel } from '../components/comments';
import { SourceCitation } from '../components/structural';
import { STRUCTURAL_MARKUPS, StructuralMarkup } from '../data/structuralMarkup';
import { VersionHistoryPanel } from '../components/version';
import { createShare } from '../services/sharing';
import {
  Fallacy,
  Rhetoric,
  Annotation,
  Comment,
  DebateDocument,
  DocumentVersion,
  Speaker,
} from '../models';
import { FALLACIES } from '../data/fallacies';
import { RHETORIC_TECHNIQUES } from '../data/rhetoric';
import {
  EXAMPLE_DOCUMENT_TITLE,
  EXAMPLE_DOCUMENT_CONTENT,
  EXAMPLE_SPEAKERS,
  DEFAULT_SPEAKERS,
} from '../data/exampleDocument';
import { useApp } from '../context';
import { saveDocument as saveDoc, createVersion } from '../services/storage';
import { SharedDebate } from '../services/sharing';
import { AnnotationStatsPanel } from '../components/stats';
import { calculateAnnotationStats } from '../utils/annotationStats';
import { trackAnalyticsEvent } from '../hooks/useAnalytics';

export interface SharedDocumentState {
  sharedDebate: SharedDebate;
}

// Simple SVG icon component for History
const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

// Extract unique fallacy, rhetoric, and structural IDs from document content
const extractUsedAnnotations = (
  content: Descendant[]
): { fallacyIds: string[]; rhetoricIds: string[]; structuralIds: string[] } => {
  const fallacyIds = new Set<string>();
  const rhetoricIds = new Set<string>();
  const structuralIds = new Set<string>();

  const traverse = (nodes: Descendant[]) => {
    for (const node of nodes) {
      if ('text' in node) {
        const textNode = node as {
          fallacyMarks?: { fallacyId: string }[];
          rhetoricMarks?: { rhetoricId: string }[];
          structuralMarks?: { markupId: string }[];
        };
        if (textNode.fallacyMarks) {
          textNode.fallacyMarks.forEach(m => fallacyIds.add(m.fallacyId));
        }
        if (textNode.rhetoricMarks) {
          textNode.rhetoricMarks.forEach(m => rhetoricIds.add(m.rhetoricId));
        }
        if (textNode.structuralMarks) {
          textNode.structuralMarks.forEach(m => structuralIds.add(m.markupId));
        }
      }
      if ('children' in node && Array.isArray((node as { children: Descendant[] }).children)) {
        traverse((node as { children: Descendant[] }).children);
      }
    }
  };

  traverse(content);
  return {
    fallacyIds: Array.from(fallacyIds),
    rhetoricIds: Array.from(rhetoricIds),
    structuralIds: Array.from(structuralIds),
  };
};

// Extract structural markup statistics from document content
const extractStructuralMarkupStats = (content: Descendant[]): Record<string, number> => {
  const stats: Record<string, number> = {};

  const traverse = (nodes: Descendant[]) => {
    for (const node of nodes) {
      if ('text' in node) {
        const textNode = node as { structuralMarks?: { markupId: string }[] };
        if (textNode.structuralMarks) {
          textNode.structuralMarks.forEach(m => {
            stats[m.markupId] = (stats[m.markupId] || 0) + 1;
          });
        }
      }
      if ('children' in node && Array.isArray((node as { children: Descendant[] }).children)) {
        traverse((node as { children: Descendant[] }).children);
      }
    }
  };

  traverse(content);
  return stats;
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
    if (!element.children || !Array.isArray(element.children) || element.children.length === 0)
      return false;
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
  const location = useLocation();
  const {
    state,
    loadDocument,
    loadDocuments,
    createDocument,
    saveDocument,
    deleteDocument,
    updatePreferences,
  } = useApp();

  // Check if viewing a shared document (passed via location state from SharedDebatePage)
  const sharedDocState = location.state as SharedDocumentState | null;
  const isViewingShared = !!sharedDocState?.sharedDebate;
  const sharedDebate = sharedDocState?.sharedDebate;
  const { documents, preferences, isLoading } = state;

  const editorRef = useRef<DebateEditorHandle>(null);
  const initializingRef = useRef(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(false);
  const [sidebarStatesSynced, setSidebarStatesSynced] = useState(false);

  // Detect if on mobile (viewport width < 1024px which is lg breakpoint)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [selectedFallacy, setSelectedFallacy] = useState<Fallacy | null>(null);
  const [selectedRhetoric, setSelectedRhetoric] = useState<Rhetoric | null>(null);
  const [currentDoc, setCurrentDoc] = useState<DebateDocument | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [annotationTab, setAnnotationTab] = useState<AnnotationTabType>('fallacies');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [hasTextSelection, setHasTextSelection] = useState(false);
  const [sharePopup, setSharePopup] = useState<{ url: string; copied: boolean } | null>(null);
  const [showSpeakerPanel, setShowSpeakerPanel] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [selectedStructuralMarkup, setSelectedStructuralMarkup] = useState<StructuralMarkup | null>(
    null
  );
  const [selectedStructuralMetadata, setSelectedStructuralMetadata] = useState<
    | {
        sourceUrl?: string;
        sourceAuthor?: string;
        sourceDate?: string;
        sourcePublication?: string;
        verificationStatus?: 'unverified' | 'verified' | 'disputed';
      }
    | undefined
  >(undefined);
  const [storedSelection, setStoredSelection] = useState<Range | null>(null);
  const [structuralClickNonce, setStructuralClickNonce] = useState(0);
  const [hiddenSpeakerIds, setHiddenSpeakerIds] = useState<string[]>([]);
  const [pinnedSpeakerIds, setPinnedSpeakerIds] = useState<string[]>([]);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [hiddenAnnotationIds, setHiddenAnnotationIds] = useState<HiddenAnnotationIds>({
    fallacyIds: [],
    rhetoricIds: [],
    structuralIds: [],
  });

  // Cache share URLs per document to avoid creating duplicates
  const shareUrlCache = useRef<Record<string, string>>({});

  // Sync sidebar states from preferences once loaded
  useEffect(() => {
    if (!isLoading && !sidebarStatesSynced) {
      // Left sidebar always starts closed
      setShowLeftSidebar(false);
      // Right sidebar: on mobile start closed, on desktop restore saved preference
      if (isMobile) {
        setRightSidebarExpanded(false);
      } else {
        setRightSidebarExpanded(preferences.rightSidebarOpen ?? true);
      }
      setSidebarStatesSynced(true);
    }
  }, [isLoading, sidebarStatesSynced, isMobile, preferences.rightSidebarOpen]);

  // Auto-pin the first two speakers when document loads
  useEffect(() => {
    if (currentDoc?.speakers && currentDoc.speakers.length >= 2) {
      const firstTwoIds = currentDoc.speakers.slice(0, 2).map(s => s.id);
      setPinnedSpeakerIds(prev => {
        // Only update if the first two speakers aren't already pinned
        const alreadyPinned = firstTwoIds.every(id => prev.includes(id));
        if (alreadyPinned) return prev;
        // Merge: keep existing pins, add new first two
        const newPins = Array.from(new Set(firstTwoIds.concat(prev)));
        return newPins;
      });
    }
  }, [currentDoc?.id, currentDoc?.speakers]);

  // Restore hidden annotation IDs from document when document changes
  useEffect(() => {
    if (currentDoc?.hiddenAnnotationIds) {
      setHiddenAnnotationIds(currentDoc.hiddenAnnotationIds);
    } else {
      setHiddenAnnotationIds({ fallacyIds: [], rhetoricIds: [], structuralIds: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDoc?.id]);

  // Persist hidden annotation IDs back to document when they change
  useEffect(() => {
    if (!currentDoc || !isInitialized) return;
    const hasHidden =
      hiddenAnnotationIds.fallacyIds.length > 0 ||
      hiddenAnnotationIds.rhetoricIds.length > 0 ||
      hiddenAnnotationIds.structuralIds.length > 0;
    const docHas = !!currentDoc.hiddenAnnotationIds;
    // Only update if there's a meaningful change
    if (hasHidden || docHas) {
      setCurrentDoc(prev => {
        if (!prev) return prev;
        return { ...prev, hiddenAnnotationIds: hasHidden ? hiddenAnnotationIds : undefined };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hiddenAnnotationIds]);

  // Extract used annotations from current document content
  const {
    usedFallacies,
    usedRhetoric,
    usedStructural: _usedStructural,
  } = useMemo(() => {
    if (!currentDoc?.content) {
      return { usedFallacies: [], usedRhetoric: [], usedStructural: [] };
    }
    const { fallacyIds, rhetoricIds, structuralIds } = extractUsedAnnotations(currentDoc.content);
    const usedFallacies = fallacyIds
      .map(id => FALLACIES.find(f => f.id === id))
      .filter((f): f is Fallacy => f !== undefined);
    const usedRhetoric = rhetoricIds
      .map(id => RHETORIC_TECHNIQUES.find(r => r.id === id))
      .filter((r): r is Rhetoric => r !== undefined);
    const usedStructural = structuralIds
      .map(id => STRUCTURAL_MARKUPS.find(s => s.id === id))
      .filter((s): s is StructuralMarkup => s !== undefined);
    return { usedFallacies, usedRhetoric, usedStructural };
  }, [currentDoc?.content]);

  // Extract structural markup statistics from current document content
  const _structuralMarkupStats = useMemo(() => {
    if (!currentDoc?.content) return {};
    return extractStructuralMarkupStats(currentDoc.content);
  }, [currentDoc?.content]);

  // Calculate annotation statistics for the stats panel
  const annotationStats = useMemo(() => {
    if (!currentDoc?.content) return calculateAnnotationStats([]);
    return calculateAnnotationStats(currentDoc.content, currentDoc.speakers);
  }, [currentDoc?.content, currentDoc?.speakers]);

  // Extract used speaker IDs from document content
  const usedSpeakerIds = useMemo(() => {
    if (!currentDoc?.content) return [];
    const speakerIds = new Set<string>();
    const traverse = (nodes: Descendant[]) => {
      for (const node of nodes) {
        if ('type' in node && (node.type === 'paragraph' || node.type === 'block-quote')) {
          const element = node as { speakerId?: string };
          if (element.speakerId) {
            speakerIds.add(element.speakerId);
          }
        }
        if ('children' in node && Array.isArray(node.children)) {
          traverse(node.children as Descendant[]);
        }
      }
    };
    traverse(currentDoc.content);
    return Array.from(speakerIds);
  }, [currentDoc?.content]);

  // Build list of pinned annotations for toolbar shortcuts
  const pinnedAnnotations = useMemo((): PinnedAnnotation[] => {
    const pinned: PinnedAnnotation[] = [];

    // Add pinned fallacies
    (preferences.pinnedFallacies || []).forEach(id => {
      const fallacy = FALLACIES.find(f => f.id === id);
      if (fallacy) {
        pinned.push({
          id: fallacy.id,
          name: fallacy.name,
          color: fallacy.color,
          type: 'fallacy',
        });
      }
    });

    // Add pinned rhetoric
    (preferences.pinnedRhetoric || []).forEach(id => {
      const rhetoric = RHETORIC_TECHNIQUES.find(r => r.id === id);
      if (rhetoric) {
        pinned.push({
          id: rhetoric.id,
          name: rhetoric.name,
          color: rhetoric.color,
          type: 'rhetoric',
        });
      }
    });

    return pinned;
  }, [preferences.pinnedFallacies, preferences.pinnedRhetoric]);

  // Build list of pinned speakers for toolbar shortcuts
  const pinnedSpeakers = useMemo(() => {
    if (!currentDoc?.speakers) return [];
    return pinnedSpeakerIds
      .map(id => currentDoc.speakers?.find(s => s.id === id))
      .filter((s): s is Speaker => !!s)
      .map(s => ({ id: s.id, name: s.name, color: s.color }));
  }, [pinnedSpeakerIds, currentDoc?.speakers]);

  useEffect(() => {
    // For shared documents, create a virtual document from the shared data
    if (isViewingShared && sharedDebate && !isInitialized) {
      const content = sharedDebate.content.content as Descendant[];
      const annotations = sharedDebate.content.annotations || {};
      const virtualDoc: DebateDocument = {
        id: `shared_${sharedDebate.id}`,
        title: sharedDebate.title,
        content,
        annotations,
        createdAt: new Date(sharedDebate.created).getTime(),
        updatedAt: new Date(sharedDebate.created).getTime(),
      };
      setCurrentDoc(virtualDoc);
      setIsInitialized(true);
      return;
    }

    if (isLoading || isInitialized || initializingRef.current || isViewingShared) return;

    const initDocument = async () => {
      // Guard against concurrent calls (React StrictMode double-mount)
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
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
          // Use localStorage flag to prevent duplicate example document creation
          const exampleCreated = localStorage.getItem('debate-dissector-example-created');
          const isFirstTime = freshDocs.length === 0 && !exampleCreated;

          if (isFirstTime) {
            // Mark as created BEFORE creating to prevent race conditions
            localStorage.setItem('debate-dissector-example-created', 'true');
            // Create example document with pre-marked fallacies and speakers
            doc = await createDocument(
              EXAMPLE_DOCUMENT_TITLE,
              EXAMPLE_DOCUMENT_CONTENT,
              EXAMPLE_SPEAKERS
            );
          } else if (freshDocs.length > 0) {
            // Load the first existing document instead of creating a new one
            doc = await loadDocument(freshDocs[0].id);
          } else {
            // Edge case: no docs exist but example was already created (shouldn't happen normally)
            // Create a new untitled document with default speakers
            doc = await createDocument('Untitled Debate', undefined, DEFAULT_SPEAKERS);
          }
        }

        if (doc) {
          setCurrentDoc(doc);
          await updatePreferences({ lastEditedDocumentId: doc.id });
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize document:', error);
        initializingRef.current = false;
      }
    };

    initDocument();
  }, [
    id,
    isLoading,
    isInitialized,
    isViewingShared,
    sharedDebate,
    preferences.lastEditedDocumentId,
    loadDocument,
    loadDocuments,
    createDocument,
    updatePreferences,
  ]);

  // Handler for importing a shared document as a local copy
  const handleImportAsCopy = useCallback(async () => {
    if (!sharedDebate || !currentDoc) return;

    const content = sharedDebate.content.content as Descendant[];
    const annotations = sharedDebate.content.annotations || {};

    // Create document first (without annotations)
    const newDoc = await createDocument(`${sharedDebate.title} (Copy)`, content);

    // Then save with annotations
    await saveDocument({
      ...newDoc,
      annotations,
    });

    // Navigate to the new document (clears shared state)
    navigate(`/editor/${newDoc.id}`, { replace: true });
    if (sharedDebate) trackAnalyticsEvent('shared_doc_imported', { shareId: sharedDebate.id });
  }, [sharedDebate, currentDoc, createDocument, saveDocument, navigate]);

  // One-click share: upload to PocketBase and copy link (with caching)
  const handleShare = useCallback(async () => {
    if (!currentDoc || isSharing) return;

    // Check cache first
    const cachedUrl = shareUrlCache.current[currentDoc.id];
    if (cachedUrl) {
      setSharePopup({ url: cachedUrl, copied: false });
      return;
    }

    setIsSharing(true);
    try {
      const result = await createShare({
        title: currentDoc.title,
        content: currentDoc.content,
        annotations: currentDoc.annotations || {},
      });

      // Cache the URL
      shareUrlCache.current[currentDoc.id] = result.shareUrl;
      setSharePopup({ url: result.shareUrl, copied: false });
      trackAnalyticsEvent('share_link_created', { documentId: currentDoc.id });
    } catch (error) {
      console.error('Failed to share:', error);
      setSharePopup(null);
    } finally {
      setIsSharing(false);
    }
  }, [currentDoc, isSharing]);

  const handleCopyShareLink = useCallback(async () => {
    if (!sharePopup) return;
    try {
      await navigator.clipboard.writeText(sharePopup.url);
      setSharePopup({ ...sharePopup, copied: true });
      setTimeout(() => setSharePopup(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [sharePopup]);

  const handleFallacySelect = useCallback((fallacy: Fallacy | null) => {
    setSelectedFallacy(fallacy);
    setSelectedRhetoric(null);
    setSelectedStructuralMarkup(null);
  }, []);

  const handleRhetoricSelect = useCallback((rhetoric: Rhetoric | null) => {
    setSelectedRhetoric(rhetoric);
    setSelectedFallacy(null);
    setSelectedStructuralMarkup(null);
  }, []);

  const handleStructuralSelect = useCallback((markup: StructuralMarkup | null) => {
    setSelectedStructuralMarkup(markup);
    setSelectedStructuralMetadata(undefined);
    setSelectedFallacy(null);
    setSelectedRhetoric(null);
  }, []);

  const handleStatsAnnotationClick = useCallback(
    (id: string, type: 'fallacy' | 'rhetoric' | 'structural') => {
      trackAnalyticsEvent('stats_breakdown_clicked', { type, id, name: id });
      // Close stats panel
      setShowStatsPanel(false);
      // Open annotation sidebar
      setRightSidebarExpanded(true);
      updatePreferences({ rightSidebarOpen: true });

      if (type === 'fallacy') {
        const fallacy = FALLACIES.find(f => f.id === id);
        if (fallacy) {
          setAnnotationTab('fallacies');
          setSelectedFallacy(fallacy);
          setSelectedRhetoric(null);
          setSelectedStructuralMarkup(null);
        }
      } else if (type === 'rhetoric') {
        const rhetoric = RHETORIC_TECHNIQUES.find(r => r.id === id);
        if (rhetoric) {
          setAnnotationTab('rhetoric');
          setSelectedRhetoric(rhetoric);
          setSelectedFallacy(null);
          setSelectedStructuralMarkup(null);
        }
      } else if (type === 'structural') {
        const markup = STRUCTURAL_MARKUPS.find(m => m.id === id);
        if (markup) {
          setAnnotationTab('structural');
          setSelectedStructuralMarkup(markup);
          setSelectedStructuralMetadata(undefined);
          setSelectedFallacy(null);
          setSelectedRhetoric(null);
        }
      }
    },
    [updatePreferences]
  );

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

  const handleFallacyApply = useCallback(
    (fallacy: Fallacy) => {
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
        setCurrentDoc(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            annotations: { ...prev.annotations, [annotationId]: newAnnotation },
          };
        });
        trackAnalyticsEvent('annotation_applied', {
          type: 'fallacy',
          id: fallacy.id,
          name: fallacy.name,
        });
      }
    },
    [currentDoc]
  );

  const handleRhetoricApply = useCallback(
    (rhetoric: Rhetoric) => {
      const editor = editorRef.current?.getEditor();
      if (!editor || !currentDoc) return;

      const result = applyRhetoricMark(editor, rhetoric.id, rhetoric.color);
      if (result) {
        trackAnalyticsEvent('annotation_applied', {
          type: 'rhetoric',
          id: rhetoric.id,
          name: rhetoric.name,
        });
      }
    },
    [currentDoc]
  );

  const _handleClearAnnotations = useCallback(() => {
    const editor = editorRef.current?.getEditor();
    if (!editor) return;
    clearAllAnnotations(editor);
  }, []);

  const handleApplyPinnedAnnotation = useCallback(
    (annotation: PinnedAnnotation) => {
      if (annotation.type === 'fallacy') {
        const fallacy = FALLACIES.find(f => f.id === annotation.id);
        if (fallacy) {
          handleFallacyApply(fallacy);
        }
      } else {
        const rhetoric = RHETORIC_TECHNIQUES.find(r => r.id === annotation.id);
        if (rhetoric) {
          handleRhetoricApply(rhetoric);
        }
      }
      // Close sidebar on mobile after applying
      if (isMobile) {
        setRightSidebarExpanded(false);
      }
    },
    [handleFallacyApply, handleRhetoricApply, isMobile]
  );

  // Speaker handlers
  const handleSpeakerAdd = useCallback(
    (speaker: Speaker) => {
      if (!currentDoc) return;
      const updatedSpeakers = [...(currentDoc.speakers || []), speaker];
      setCurrentDoc({ ...currentDoc, speakers: updatedSpeakers });
      trackAnalyticsEvent('speaker_created', { speakerName: speaker.name });
    },
    [currentDoc]
  );

  const handleSpeakerUpdate = useCallback(
    (speaker: Speaker) => {
      if (!currentDoc) return;
      const updatedSpeakers = (currentDoc.speakers || []).map(s =>
        s.id === speaker.id ? speaker : s
      );
      setCurrentDoc({ ...currentDoc, speakers: updatedSpeakers });
      trackAnalyticsEvent('speaker_edited', { speakerId: speaker.id, speakerName: speaker.name });
    },
    [currentDoc]
  );

  const handleSpeakerDelete = useCallback(
    (speakerId: string) => {
      if (!currentDoc) return;
      const updatedSpeakers = (currentDoc.speakers || []).filter(s => s.id !== speakerId);
      setCurrentDoc({ ...currentDoc, speakers: updatedSpeakers });
      trackAnalyticsEvent('speaker_deleted', { speakerId });
    },
    [currentDoc]
  );

  const handleAssignSpeaker = useCallback(
    (speakerId: string | null) => {
      const editor = editorRef.current?.getEditor();
      if (!editor) return;
      assignSpeakerToSelection(editor, speakerId);
      if (speakerId && currentDoc) {
        const speaker = (currentDoc.speakers || []).find(s => s.id === speakerId);
        if (speaker)
          trackAnalyticsEvent('speaker_assigned', { speakerId, speakerName: speaker.name });
      }
    },
    [currentDoc]
  );

  // Toggle version for pinned speaker buttons - removes speaker if already assigned
  const handleToggleAssignSpeaker = useCallback((speakerId: string) => {
    const editor = editorRef.current?.getEditor();
    if (!editor) return;
    assignSpeakerToSelection(editor, speakerId, true);
  }, []);

  const handleToggleSpeakerVisibility = useCallback((speakerId: string) => {
    setHiddenSpeakerIds(prev =>
      prev.includes(speakerId) ? prev.filter(id => id !== speakerId) : [...prev, speakerId]
    );
  }, []);

  const handleToggleSpeakerPin = useCallback((speakerId: string) => {
    setPinnedSpeakerIds(prev =>
      prev.includes(speakerId) ? prev.filter(id => id !== speakerId) : [...prev, speakerId]
    );
  }, []);

  // Comment handlers
  const handleAddComment = useCallback(
    (text: string, selectedText: string) => {
      const editor = editorRef.current?.getEditor();
      if (!editor || !currentDoc) return;

      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();
      const newComment: Comment = {
        id: commentId,
        text,
        selectedText,
        resolved: false,
        createdAt: now,
        updatedAt: now,
      };

      // Apply comment mark to selected text
      applyCommentMark(editor, commentId);

      // Add comment to document
      setCurrentDoc(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: { ...(prev.comments || {}), [commentId]: newComment },
        };
      });
      setActiveCommentId(commentId);
      trackAnalyticsEvent('comment_created', { commentId });
    },
    [currentDoc]
  );

  const handleEditComment = useCallback(
    (commentId: string, text: string) => {
      if (!currentDoc) return;
      setCurrentDoc(prev => {
        if (!prev || !prev.comments?.[commentId]) return prev;
        return {
          ...prev,
          comments: {
            ...prev.comments,
            [commentId]: { ...prev.comments[commentId], text, updatedAt: Date.now() },
          },
        };
      });
      trackAnalyticsEvent('comment_edited', { commentId });
    },
    [currentDoc]
  );

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      const editor = editorRef.current?.getEditor();
      if (!editor || !currentDoc) return;

      // Remove comment mark from editor content
      removeCommentMark(editor, commentId);

      // Also delete any replies to this comment
      const replies = Object.values(currentDoc.comments || {}).filter(
        c => c.parentId === commentId
      );

      // Remove comment from document
      setCurrentDoc(prev => {
        if (!prev) return prev;
        const updatedComments = { ...(prev.comments || {}) };
        delete updatedComments[commentId];
        // Delete replies too
        for (const reply of replies) {
          delete updatedComments[reply.id];
        }
        return { ...prev, comments: updatedComments };
      });

      if (activeCommentId === commentId) {
        setActiveCommentId(null);
      }
      trackAnalyticsEvent('comment_deleted', { commentId });
    },
    [currentDoc, activeCommentId]
  );

  const handleResolveComment = useCallback(
    (commentId: string) => {
      if (!currentDoc) return;
      setCurrentDoc(prev => {
        if (!prev || !prev.comments?.[commentId]) return prev;
        const comment = prev.comments[commentId];
        return {
          ...prev,
          comments: {
            ...prev.comments,
            [commentId]: { ...comment, resolved: !comment.resolved, updatedAt: Date.now() },
          },
        };
      });
      trackAnalyticsEvent('comment_resolved', { commentId });
    },
    [currentDoc]
  );

  const handleReplyComment = useCallback(
    (parentId: string, text: string, selectedText: string) => {
      if (!currentDoc) return;
      const replyId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();
      const reply: Comment = {
        id: replyId,
        text,
        selectedText,
        parentId,
        resolved: false,
        createdAt: now,
        updatedAt: now,
      };

      setCurrentDoc(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: { ...(prev.comments || {}), [replyId]: reply },
        };
      });
      trackAnalyticsEvent('comment_replied', { commentId: replyId, parentId });
    },
    [currentDoc]
  );

  const handleCommentClick = useCallback(
    (commentId: string) => {
      setActiveCommentId(commentId === activeCommentId ? null : commentId);
    },
    [activeCommentId]
  );

  // Annotation visibility toggle handlers
  const handleToggleFallacyVisibility = useCallback((id: string) => {
    setHiddenAnnotationIds(prev => {
      const hiding = !prev.fallacyIds.includes(id);
      trackAnalyticsEvent('annotation_visibility_toggled', {
        type: 'fallacy',
        id,
        action: hiding ? 'hide' : 'show',
      });
      return {
        ...prev,
        fallacyIds: hiding ? [...prev.fallacyIds, id] : prev.fallacyIds.filter(x => x !== id),
      };
    });
  }, []);

  const handleToggleRhetoricVisibility = useCallback((id: string) => {
    setHiddenAnnotationIds(prev => {
      const hiding = !prev.rhetoricIds.includes(id);
      trackAnalyticsEvent('annotation_visibility_toggled', {
        type: 'rhetoric',
        id,
        action: hiding ? 'hide' : 'show',
      });
      return {
        ...prev,
        rhetoricIds: hiding ? [...prev.rhetoricIds, id] : prev.rhetoricIds.filter(x => x !== id),
      };
    });
  }, []);

  const handleToggleStructuralVisibility = useCallback((id: string) => {
    setHiddenAnnotationIds(prev => {
      const hiding = !prev.structuralIds.includes(id);
      trackAnalyticsEvent('annotation_visibility_toggled', {
        type: 'structural',
        id,
        action: hiding ? 'hide' : 'show',
      });
      return {
        ...prev,
        structuralIds: hiding
          ? [...prev.structuralIds, id]
          : prev.structuralIds.filter(x => x !== id),
      };
    });
  }, []);

  const handleBulkToggleFallacies = useCallback((hide: boolean) => {
    trackAnalyticsEvent('annotation_bulk_visibility_toggled', {
      type: 'fallacy',
      scope: 'section',
      action: hide ? 'hide' : 'show',
      count: FALLACIES.length,
    });
    setHiddenAnnotationIds(prev => ({
      ...prev,
      fallacyIds: hide ? FALLACIES.map(f => f.id) : [],
    }));
  }, []);

  const handleBulkToggleRhetoric = useCallback((hide: boolean) => {
    trackAnalyticsEvent('annotation_bulk_visibility_toggled', {
      type: 'rhetoric',
      scope: 'section',
      action: hide ? 'hide' : 'show',
      count: RHETORIC_TECHNIQUES.length,
    });
    setHiddenAnnotationIds(prev => ({
      ...prev,
      rhetoricIds: hide ? RHETORIC_TECHNIQUES.map(r => r.id) : [],
    }));
  }, []);

  const handleBulkToggleStructural = useCallback((hide: boolean) => {
    trackAnalyticsEvent('annotation_bulk_visibility_toggled', {
      type: 'structural',
      scope: 'section',
      action: hide ? 'hide' : 'show',
      count: STRUCTURAL_MARKUPS.length,
    });
    setHiddenAnnotationIds(prev => ({
      ...prev,
      structuralIds: hide ? STRUCTURAL_MARKUPS.map(s => s.id) : [],
    }));
  }, []);

  const handleBulkToggleFallacyIds = useCallback((ids: string[], hide: boolean) => {
    trackAnalyticsEvent('annotation_bulk_visibility_toggled', {
      type: 'fallacy',
      scope: 'subcategory',
      action: hide ? 'hide' : 'show',
      count: ids.length,
    });
    setHiddenAnnotationIds(prev => ({
      ...prev,
      fallacyIds: hide
        ? Array.from(new Set([...prev.fallacyIds, ...ids]))
        : prev.fallacyIds.filter(x => !ids.includes(x)),
    }));
  }, []);

  const handleBulkToggleRhetoricIds = useCallback((ids: string[], hide: boolean) => {
    trackAnalyticsEvent('annotation_bulk_visibility_toggled', {
      type: 'rhetoric',
      scope: 'subcategory',
      action: hide ? 'hide' : 'show',
      count: ids.length,
    });
    setHiddenAnnotationIds(prev => ({
      ...prev,
      rhetoricIds: hide
        ? Array.from(new Set([...prev.rhetoricIds, ...ids]))
        : prev.rhetoricIds.filter(x => !ids.includes(x)),
    }));
  }, []);

  const handleBulkToggleStructuralIds = useCallback((ids: string[], hide: boolean) => {
    trackAnalyticsEvent('annotation_bulk_visibility_toggled', {
      type: 'structural',
      scope: 'subcategory',
      action: hide ? 'hide' : 'show',
      count: ids.length,
    });
    setHiddenAnnotationIds(prev => ({
      ...prev,
      structuralIds: hide
        ? Array.from(new Set([...prev.structuralIds, ...ids]))
        : prev.structuralIds.filter(x => !ids.includes(x)),
    }));
  }, []);

  const handleShowAllAnnotations = useCallback(() => {
    setHiddenAnnotationIds({ fallacyIds: [], rhetoricIds: [], structuralIds: [] });
  }, []);

  // Get selected text for comment creation
  const currentSelectedText = useMemo(() => {
    const editor = editorRef.current?.getEditor();
    if (!editor || !hasTextSelection) return '';
    return getSelectionText(editor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasTextSelection]);

  const handleApplyStructuralMarkup = useCallback(
    (markup: StructuralMarkup, citation?: SourceCitation) => {
      const editor = editorRef.current?.getEditor();
      if (!editor) return;

      // Restore stored selection if current selection is collapsed
      if (storedSelection && (!editor.selection || Range.isCollapsed(editor.selection))) {
        Transforms.select(editor, storedSelection);
      }

      // Convert citation to metadata format if provided
      const metadata = citation
        ? {
            sourceUrl: citation.url,
            sourceAuthor: citation.author,
            sourceDate: citation.date,
            sourcePublication: citation.publication,
            verificationStatus: citation.verificationStatus,
          }
        : undefined;
      applyStructuralMark(editor, markup.id, markup.color, metadata);
      trackAnalyticsEvent('annotation_applied', {
        type: 'structural',
        id: markup.id,
        name: markup.name,
      });

      // Only clear stored selection if removing the annotation (no citation provided)
      // Keep it for metadata updates so auto-save continues to work
      if (!citation) {
        setStoredSelection(null);
      }
    },
    [storedSelection]
  );

  // Keyboard shortcuts for structural markup (Alt + key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Alt + key combinations when not in input fields
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const editor = editorRef.current?.getEditor();
      if (!editor || !hasTextSelection) return;

      const key = e.key.toUpperCase();
      const markup = STRUCTURAL_MARKUPS.find(m => m.shortcut === key);

      if (markup) {
        e.preventDefault();
        applyStructuralMark(editor, markup.id, markup.color);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasTextSelection]);

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
        rhetoricMarks?: { rhetoricId: string; appliedAt?: number }[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        structuralMarks?: { markupId: string; metadata?: any }[];
      };

      if (!leaf || typeof leaf.text !== 'string') return;

      // If a structural markup is selected, check if cursor text has matching metadata
      // Clear metadata if it doesn't, but don't switch tabs
      if (selectedStructuralMarkup) {
        const structuralMarks = leaf.structuralMarks || [];
        const matchingMark = structuralMarks.find(m => m.markupId === selectedStructuralMarkup.id);
        if (!matchingMark || !matchingMark.metadata) {
          setSelectedStructuralMetadata(undefined);
        } else {
          setSelectedStructuralMetadata(matchingMark.metadata);
        }
        return;
      }

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
  }, [selectedStructuralMarkup]);

  const handleContentChange = useCallback((value: Descendant[]) => {
    setCurrentDoc(prev => {
      if (!prev) return prev;
      return { ...prev, content: value, updatedAt: Date.now() };
    });
  }, []);

  const handleTitleChange = useCallback((title: string) => {
    setCurrentDoc(prev => {
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

  const handleDocumentSelect = useCallback(
    async (docId: string) => {
      if (docId === currentDoc?.id) return;
      const doc = await loadDocument(docId);
      if (doc) {
        setCurrentDoc(doc);
        await updatePreferences({ lastEditedDocumentId: doc.id });
        navigate(`/editor/${doc.id}`);
      }
    },
    [currentDoc?.id, loadDocument, updatePreferences, navigate]
  );

  const handleDocumentDelete = useCallback(
    async (docId: string) => {
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
    },
    [
      currentDoc?.id,
      documents,
      deleteDocument,
      loadDocument,
      createDocument,
      updatePreferences,
      navigate,
    ]
  );

  const handleVersionRestore = useCallback(
    async (version: DocumentVersion) => {
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
    },
    [currentDoc]
  );

  useEffect(() => {
    if (!currentDoc || !isInitialized) return;

    const timeoutId = setTimeout(() => {
      saveDocument(currentDoc);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [currentDoc, isInitialized, saveDocument]);

  if (isLoading || !isInitialized || !currentDoc) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading editor...</p>
        </div>
      </div>
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
          onStructuralSelect={handleStructuralSelect}
          onStructuralApply={handleApplyStructuralMarkup}
          selectedStructuralId={selectedStructuralMarkup?.id}
          selectedStructuralMetadata={
            selectedStructuralMetadata
              ? {
                  url: selectedStructuralMetadata.sourceUrl,
                  author: selectedStructuralMetadata.sourceAuthor,
                  date: selectedStructuralMetadata.sourceDate,
                  publication: selectedStructuralMetadata.sourcePublication,
                  verificationStatus: selectedStructuralMetadata.verificationStatus,
                }
              : undefined
          }
          structuralClickNonce={structuralClickNonce}
          activeTab={annotationTab}
          onTabChange={setAnnotationTab}
          hiddenAnnotationIds={hiddenAnnotationIds}
          onToggleFallacyVisibility={handleToggleFallacyVisibility}
          onToggleRhetoricVisibility={handleToggleRhetoricVisibility}
          onToggleStructuralVisibility={handleToggleStructuralVisibility}
          onBulkToggleFallacies={handleBulkToggleFallacies}
          onBulkToggleRhetoric={handleBulkToggleRhetoric}
          onBulkToggleStructural={handleBulkToggleStructural}
          onShowAllAnnotations={handleShowAllAnnotations}
          onBulkToggleFallacyIds={handleBulkToggleFallacyIds}
          onBulkToggleRhetoricIds={handleBulkToggleRhetoricIds}
          onBulkToggleStructuralIds={handleBulkToggleStructuralIds}
        />
      }
      rightSidebarExpanded={rightSidebarExpanded}
      onRightSidebarToggle={handleRightSidebarToggle}
    >
      <Header
        onMenuClick={isViewingShared ? () => navigate('/') : handleLeftSidebarToggle}
        titleElement={
          isViewingShared ? (
            <h1 className="text-lg font-semibold text-gray-900">{currentDoc.title}</h1>
          ) : (
            <input
              type="text"
              value={currentDoc.title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Untitled Debate"
              className="w-full text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400"
            />
          )
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
            {/* Shared document actions */}
            {isViewingShared && (
              <>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  View Only
                </span>
                <button
                  onClick={handleImportAsCopy}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium"
                >
                  Import as Copy
                </button>
              </>
            )}
            {/* Share button - only for local documents */}
            {!isViewingShared && (
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation disabled:opacity-50"
                title={isSharing ? 'Sharing...' : 'Share'}
              >
                {isSharing ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                )}
              </button>
            )}
            {/* Version history - only for local documents */}
            {!isViewingShared && (
              <button
                onClick={() => setShowVersionHistory(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                title="Version History"
              >
                <HistoryIcon className="w-5 h-5" />
              </button>
            )}
            {/* Speaker panel toggle */}
            {!isViewingShared && (
              <button
                onClick={() => setShowSpeakerPanel(!showSpeakerPanel)}
                className={`p-2 rounded-lg transition-colors touch-manipulation ${
                  showSpeakerPanel ? 'bg-cyan-100 hover:bg-cyan-200' : 'hover:bg-gray-100'
                }`}
                title="Speakers"
              >
                <svg
                  className={`w-5 h-5 ${showSpeakerPanel ? 'text-cyan-600' : 'text-gray-600'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </button>
            )}
            {/* Stats panel toggle */}
            {!isViewingShared && (
              <button
                onClick={() => {
                  const next = !showStatsPanel;
                  setShowStatsPanel(next);
                  if (next) trackAnalyticsEvent('stats_panel_opened');
                }}
                className={`p-2 rounded-lg transition-colors touch-manipulation ${
                  showStatsPanel ? 'bg-indigo-100 hover:bg-indigo-200' : 'hover:bg-gray-100'
                }`}
                title="Statistics"
              >
                <svg
                  className={`w-5 h-5 ${showStatsPanel ? 'text-indigo-600' : 'text-gray-600'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13h2v8H3zm6-4h2v12H9zm6-6h2v18h-2zm6 10h2v8h-2z"
                  />
                </svg>
              </button>
            )}
            {/* Comment panel toggle */}
            {!isViewingShared && (
              <button
                onClick={() => setShowCommentPanel(!showCommentPanel)}
                className={`relative p-2 rounded-lg transition-colors touch-manipulation ${
                  showCommentPanel ? 'bg-amber-100 hover:bg-amber-200' : 'hover:bg-gray-100'
                }`}
                title="Comments"
              >
                <svg
                  className={`w-5 h-5 ${showCommentPanel ? 'text-amber-600' : 'text-gray-600'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h6m-3 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                {Object.values(currentDoc.comments || {}).filter(c => !c.parentId && !c.resolved)
                  .length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {
                      Object.values(currentDoc.comments || {}).filter(
                        c => !c.parentId && !c.resolved
                      ).length
                    }
                  </span>
                )}
              </button>
            )}
            {/* Annotation panel toggle */}
            <button
              onClick={handleRightSidebarToggle}
              className="p-2 bg-violet-100 hover:bg-violet-200 rounded-lg transition-colors touch-manipulation"
              title="Annotations"
            >
              <svg
                className="w-5 h-5 text-violet-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
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
            onChange={isViewingShared ? () => {} : handleContentChange}
            onSelectionChange={handleSelectionChange}
            readOnly={isViewingShared}
            onFallacyClick={fallacyId => {
              const fallacy = FALLACIES.find(f => f.id === fallacyId);
              if (fallacy) {
                setAnnotationTab('fallacies');
                setSelectedFallacy(fallacy);
                setSelectedRhetoric(null);
                setSelectedStructuralMarkup(null);
              }
            }}
            onRhetoricClick={rhetoricId => {
              const rhetoric = RHETORIC_TECHNIQUES.find(r => r.id === rhetoricId);
              if (rhetoric) {
                setAnnotationTab('rhetoric');
                setSelectedRhetoric(rhetoric);
                setSelectedFallacy(null);
                setSelectedStructuralMarkup(null);
              }
            }}
            onStructuralClick={(markupId, metadata) => {
              const markup = STRUCTURAL_MARKUPS.find(m => m.id === markupId);
              if (markup) {
                // Store the current selection before it gets lost
                const editor = editorRef.current?.getEditor();
                if (editor?.selection && !Range.isCollapsed(editor.selection)) {
                  setStoredSelection(editor.selection);
                }
                setAnnotationTab('structural');
                setSelectedStructuralMarkup(markup);
                setSelectedFallacy(null);
                setSelectedRhetoric(null);
                // Store metadata for citation form pre-population
                setSelectedStructuralMetadata(metadata);
                setStructuralClickNonce(n => n + 1);
              }
            }}
            placeholder="Start typing or paste debate text here. Select text and click a fallacy to annotate it."
            selectedAnnotation={
              selectedFallacy
                ? { name: selectedFallacy.name, color: selectedFallacy.color }
                : selectedRhetoric
                  ? { name: selectedRhetoric.name, color: selectedRhetoric.color }
                  : selectedStructuralMarkup
                    ? { name: selectedStructuralMarkup.name, color: selectedStructuralMarkup.color }
                    : null
            }
            hasTextSelection={hasTextSelection}
            onApplyAnnotation={() => {
              if (selectedFallacy) {
                handleFallacyApply(selectedFallacy);
              } else if (selectedRhetoric) {
                handleRhetoricApply(selectedRhetoric);
              } else if (selectedStructuralMarkup) {
                handleApplyStructuralMarkup(selectedStructuralMarkup);
              }
            }}
            pinnedAnnotations={pinnedAnnotations}
            onApplyPinnedAnnotation={handleApplyPinnedAnnotation}
            speakers={currentDoc.speakers || []}
            hiddenSpeakerIds={hiddenSpeakerIds}
            pinnedSpeakers={pinnedSpeakers}
            onAssignPinnedSpeaker={handleToggleAssignSpeaker}
            comments={currentDoc.comments || {}}
            hiddenAnnotationIds={hiddenAnnotationIds}
          />
        </div>
      </div>

      {showVersionHistory && (
        <VersionHistoryPanel
          documentId={currentDoc.id}
          onRestore={handleVersionRestore}
          onClose={() => setShowVersionHistory(false)}
        />
      )}

      {/* Speaker Panel - Slide-over from right */}
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
            showSpeakerPanel ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
          }`}
          onClick={() => setShowSpeakerPanel(false)}
        />
        {/* Panel */}
        <aside
          className={`fixed inset-y-0 right-0 z-50 w-80 border-l border-gray-200 bg-white overflow-hidden flex-shrink-0 shadow-lg transition-transform duration-300 ease-in-out ${
            showSpeakerPanel ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="complementary"
          aria-label="Speaker panel"
          aria-hidden={!showSpeakerPanel}
        >
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <SpeakerPanel
                speakers={currentDoc.speakers || []}
                usedSpeakerIds={usedSpeakerIds}
                hiddenSpeakerIds={hiddenSpeakerIds}
                pinnedSpeakerIds={pinnedSpeakerIds}
                onSpeakerAdd={handleSpeakerAdd}
                onSpeakerUpdate={handleSpeakerUpdate}
                onSpeakerDelete={handleSpeakerDelete}
                onAssignSpeaker={handleAssignSpeaker}
                onToggleSpeakerVisibility={handleToggleSpeakerVisibility}
                onToggleSpeakerPin={handleToggleSpeakerPin}
              />
            </div>
            <div className="border-t border-gray-200 p-2 flex justify-center">
              <button
                onClick={() => setShowSpeakerPanel(false)}
                className="p-3 bg-violet-100 hover:bg-violet-200 rounded-lg touch-manipulation"
                title="Close panel"
                aria-label="Close speaker panel"
              >
                <svg
                  className="w-5 h-5 text-violet-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </aside>
      </>

      {/* Stats Panel - Slide-over from right */}
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
            showStatsPanel ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
          }`}
          onClick={() => setShowStatsPanel(false)}
        />
        {/* Panel */}
        <aside
          className={`fixed inset-y-0 right-0 z-50 w-80 border-l border-gray-200 bg-white overflow-hidden flex-shrink-0 shadow-lg transition-transform duration-300 ease-in-out ${
            showStatsPanel ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="complementary"
          aria-label="Statistics panel"
          aria-hidden={!showStatsPanel}
        >
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <AnnotationStatsPanel
                stats={annotationStats}
                documentTitle={currentDoc.title}
                onClose={() => setShowStatsPanel(false)}
                onAnnotationClick={handleStatsAnnotationClick}
              />
            </div>
            <div className="border-t border-gray-200 p-2 flex justify-center">
              <button
                onClick={() => setShowStatsPanel(false)}
                className="p-3 bg-violet-100 hover:bg-violet-200 rounded-lg touch-manipulation"
                title="Close panel"
                aria-label="Close statistics panel"
              >
                <svg
                  className="w-5 h-5 text-violet-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </aside>
      </>

      {/* Comment Panel - Slide-over from right */}
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
            showCommentPanel ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
          }`}
          onClick={() => setShowCommentPanel(false)}
        />
        {/* Panel */}
        <aside
          className={`fixed inset-y-0 right-0 z-50 w-80 border-l border-gray-200 bg-white overflow-hidden flex-shrink-0 shadow-lg transition-transform duration-300 ease-in-out ${
            showCommentPanel ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="complementary"
          aria-label="Comment panel"
          aria-hidden={!showCommentPanel}
        >
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <CommentPanel
                comments={currentDoc.comments || {}}
                activeCommentId={activeCommentId}
                onAddComment={handleAddComment}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
                onResolveComment={handleResolveComment}
                onReplyComment={handleReplyComment}
                onCommentClick={handleCommentClick}
                hasTextSelection={hasTextSelection}
                selectedText={currentSelectedText}
              />
            </div>
            <div className="border-t border-gray-200 p-2 flex justify-center">
              <button
                onClick={() => setShowCommentPanel(false)}
                className="p-3 bg-violet-100 hover:bg-violet-200 rounded-lg touch-manipulation"
                title="Close panel"
                aria-label="Close comment panel"
              >
                <svg
                  className="w-5 h-5 text-violet-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </aside>
      </>

      {/* Share popup */}
      {sharePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setSharePopup(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share Link</h3>
              <button
                onClick={() => setSharePopup(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={sharePopup.url}
                className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 select-all"
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyShareLink}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  sharePopup.copied
                    ? 'bg-green-500 text-white'
                    : 'bg-violet-600 text-white hover:bg-violet-700'
                }`}
              >
                {sharePopup.copied ? (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  'Copy'
                )}
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Anyone with this link can view this document.
            </p>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
