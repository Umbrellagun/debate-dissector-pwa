import { useState, useCallback, useEffect, useRef } from 'react';
import { ArgumentLink, DebateDocument, LinkType } from '../models/document';
import { trackAnalyticsEvent } from './useAnalytics';

// Undoable action types for the argument map
type MapAction =
  | { type: 'create_link'; link: ArgumentLink }
  | { type: 'delete_link'; link: ArgumentLink }
  | { type: 'delete_links'; links: ArgumentLink[] }
  | { type: 'toggle_thesis'; markId: string; wasAdded: boolean };

const MAX_HISTORY = 50;

/**
 * Hook that wraps argument map operations (link create/delete, thesis toggle)
 * with an undo/redo command stack.
 *
 * Returns wrapped handlers to pass to ArgumentMapContainer, plus undo/redo
 * functions and state (canUndo, canRedo) for UI buttons.
 */
export function useMapHistory(
  currentDoc: DebateDocument | null,
  setCurrentDoc: React.Dispatch<React.SetStateAction<DebateDocument | null>>
) {
  const [undoStack, setUndoStack] = useState<MapAction[]>([]);
  const [redoStack, setRedoStack] = useState<MapAction[]>([]);
  // Keep refs so undo/redo closures always see latest state without stale closures
  const docRef = useRef(currentDoc);
  docRef.current = currentDoc;
  const undoRef = useRef(undoStack);
  undoRef.current = undoStack;
  const redoRef = useRef(redoStack);
  redoRef.current = redoStack;

  const pushUndo = useCallback((action: MapAction) => {
    setUndoStack(prev => {
      const next = [...prev, action];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
    setRedoStack([]);
  }, []);

  // --- Wrapped handlers ---

  const handleCreateLink = useCallback(
    (sourceMarkId: string, targetMarkId: string, linkType: LinkType) => {
      const newLink: ArgumentLink = {
        id: `link_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        sourceMarkId,
        targetMarkId,
        linkType,
        createdAt: Date.now(),
      };
      setCurrentDoc(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          argumentLinks: [...(prev.argumentLinks || []), newLink],
          updatedAt: Date.now(),
        };
      });
      pushUndo({ type: 'create_link', link: newLink });
      trackAnalyticsEvent('map_link_created', { sourceMarkId, targetMarkId, linkType });
    },
    [setCurrentDoc, pushUndo]
  );

  const handleDeleteLink = useCallback(
    (linkId: string) => {
      const doc = docRef.current;
      if (!doc) return;
      const deletedLink = (doc.argumentLinks || []).find(l => l.id === linkId);
      if (!deletedLink) return;

      setCurrentDoc(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          argumentLinks: (prev.argumentLinks || []).filter(l => l.id !== linkId),
          updatedAt: Date.now(),
        };
      });
      pushUndo({ type: 'delete_link', link: deletedLink });
      trackAnalyticsEvent('map_link_deleted', { linkId });
    },
    [setCurrentDoc, pushUndo]
  );

  const handleDeleteLinks = useCallback(
    (linkIds: string[]) => {
      const doc = docRef.current;
      if (!doc || linkIds.length === 0) return;

      const linksToDelete = (doc.argumentLinks || []).filter(l => linkIds.includes(l.id));
      if (linksToDelete.length === 0) return;

      if (linksToDelete.length === 1) {
        handleDeleteLink(linksToDelete[0].id);
        return;
      }

      setCurrentDoc(prev => {
        if (!prev) return prev;
        const idsToDelete = new Set(linkIds);
        return {
          ...prev,
          argumentLinks: (prev.argumentLinks || []).filter(l => !idsToDelete.has(l.id)),
          updatedAt: Date.now(),
        };
      });
      pushUndo({ type: 'delete_links', links: linksToDelete });
      linksToDelete.forEach(link => {
        trackAnalyticsEvent('map_link_deleted', { linkId: link.id });
      });
    },
    [setCurrentDoc, pushUndo, handleDeleteLink]
  );

  const handleToggleThesis = useCallback(
    (markId: string) => {
      const doc = docRef.current;
      if (!doc) return;
      const current = doc.thesisMarkIds || [];
      const isRemoving = current.includes(markId);

      setCurrentDoc(prev => {
        if (!prev) return prev;
        const cur = prev.thesisMarkIds || [];
        const updated = cur.includes(markId) ? cur.filter(id => id !== markId) : [...cur, markId];
        return { ...prev, thesisMarkIds: updated, updatedAt: Date.now() };
      });
      pushUndo({ type: 'toggle_thesis', markId, wasAdded: !isRemoving });
      trackAnalyticsEvent('map_thesis_toggled', {
        markId,
        action: isRemoving ? 'removed' : 'added',
      });
    },
    [setCurrentDoc, pushUndo]
  );

  // --- Undo / Redo ---

  const undo = useCallback(() => {
    const stack = undoRef.current;
    if (stack.length === 0) return;
    const action = stack[stack.length - 1];

    // Apply inverse operation
    switch (action.type) {
      case 'create_link':
        setCurrentDoc(p => {
          if (!p) return p;
          return {
            ...p,
            argumentLinks: (p.argumentLinks || []).filter(l => l.id !== action.link.id),
            updatedAt: Date.now(),
          };
        });
        break;
      case 'delete_link':
        setCurrentDoc(p => {
          if (!p) return p;
          return {
            ...p,
            argumentLinks: [...(p.argumentLinks || []), action.link],
            updatedAt: Date.now(),
          };
        });
        break;
      case 'delete_links':
        setCurrentDoc(p => {
          if (!p) return p;
          const existingIds = new Set((p.argumentLinks || []).map(l => l.id));
          const restoredLinks = action.links.filter(l => !existingIds.has(l.id));
          return {
            ...p,
            argumentLinks: [...(p.argumentLinks || []), ...restoredLinks],
            updatedAt: Date.now(),
          };
        });
        break;
      case 'toggle_thesis':
        setCurrentDoc(p => {
          if (!p) return p;
          const cur = p.thesisMarkIds || [];
          const updated = action.wasAdded
            ? cur.filter(id => id !== action.markId)
            : [...cur, action.markId];
          return { ...p, thesisMarkIds: updated, updatedAt: Date.now() };
        });
        break;
    }

    setUndoStack(stack.slice(0, -1));
    setRedoStack(prev => [...prev, action]);
    trackAnalyticsEvent('map_undo');
  }, [setCurrentDoc]);

  const redo = useCallback(() => {
    const stack = redoRef.current;
    if (stack.length === 0) return;
    const action = stack[stack.length - 1];

    // Re-apply the operation
    switch (action.type) {
      case 'create_link':
        setCurrentDoc(p => {
          if (!p) return p;
          return {
            ...p,
            argumentLinks: [...(p.argumentLinks || []), action.link],
            updatedAt: Date.now(),
          };
        });
        break;
      case 'delete_link':
        setCurrentDoc(p => {
          if (!p) return p;
          return {
            ...p,
            argumentLinks: (p.argumentLinks || []).filter(l => l.id !== action.link.id),
            updatedAt: Date.now(),
          };
        });
        break;
      case 'delete_links':
        setCurrentDoc(p => {
          if (!p) return p;
          const idsToDelete = new Set(action.links.map(l => l.id));
          return {
            ...p,
            argumentLinks: (p.argumentLinks || []).filter(l => !idsToDelete.has(l.id)),
            updatedAt: Date.now(),
          };
        });
        break;
      case 'toggle_thesis':
        setCurrentDoc(p => {
          if (!p) return p;
          const cur = p.thesisMarkIds || [];
          const updated = action.wasAdded
            ? [...cur, action.markId]
            : cur.filter(id => id !== action.markId);
          return { ...p, thesisMarkIds: updated, updatedAt: Date.now() };
        });
        break;
    }

    setRedoStack(stack.slice(0, -1));
    setUndoStack(prev => [...prev, action]);
    trackAnalyticsEvent('map_redo');
  }, [setCurrentDoc]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  // Clear history when document changes (e.g., switching documents)
  const prevDocId = useRef(currentDoc?.id);
  useEffect(() => {
    if (currentDoc?.id !== prevDocId.current) {
      setUndoStack([]);
      setRedoStack([]);
      prevDocId.current = currentDoc?.id;
    }
  }, [currentDoc?.id]);

  return {
    handleCreateLink,
    handleDeleteLink,
    handleDeleteLinks,
    handleToggleThesis,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
