import { renderHook, act } from '@testing-library/react';
import { useMapHistory } from '../useMapHistory';
import { DebateDocument, ArgumentLink } from '../../models/document';

// Minimal document factory
function makeDoc(overrides?: Partial<DebateDocument>): DebateDocument {
  return {
    id: 'doc-1',
    title: 'Test',
    content: [],
    annotations: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    argumentLinks: [],
    thesisMarkIds: [],
    ...overrides,
  };
}

describe('useMapHistory', () => {
  describe('handleCreateLink', () => {
    it('adds a link to the document', () => {
      let doc = makeDoc();
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
        else doc = updater as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleCreateLink('mark-a', 'mark-b', 'supports');
      });

      expect(setDoc).toHaveBeenCalled();
      expect(doc.argumentLinks).toHaveLength(1);
      expect(doc.argumentLinks![0].sourceMarkId).toBe('mark-a');
      expect(doc.argumentLinks![0].targetMarkId).toBe('mark-b');
      expect(doc.argumentLinks![0].linkType).toBe('supports');
    });

    it('sets canUndo to true after creating a link', () => {
      let doc = makeDoc();
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      expect(result.current.canUndo).toBe(false);

      act(() => {
        result.current.handleCreateLink('mark-a', 'mark-b', 'rebuts');
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('handleDeleteLink', () => {
    it('removes a link from the document', () => {
      const existingLink: ArgumentLink = {
        id: 'link-1',
        sourceMarkId: 'mark-a',
        targetMarkId: 'mark-b',
        linkType: 'supports',
        createdAt: Date.now(),
      };
      let doc = makeDoc({ argumentLinks: [existingLink] });
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleDeleteLink('link-1');
      });

      expect(doc.argumentLinks).toHaveLength(0);
      expect(result.current.canUndo).toBe(true);
    });

    it('does nothing if linkId not found', () => {
      let doc = makeDoc();
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleDeleteLink('nonexistent');
      });

      // setDoc should not be called since the link wasn't found
      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('handleToggleThesis', () => {
    it('adds a thesis mark when not present', () => {
      let doc = makeDoc({ thesisMarkIds: [] });
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleToggleThesis('mark-a');
      });

      expect(doc.thesisMarkIds).toContain('mark-a');
      expect(result.current.canUndo).toBe(true);
    });

    it('removes a thesis mark when already present', () => {
      let doc = makeDoc({ thesisMarkIds: ['mark-a'] });
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleToggleThesis('mark-a');
      });

      expect(doc.thesisMarkIds).not.toContain('mark-a');
    });
  });

  describe('undo', () => {
    it('undoes link creation by removing the link', () => {
      let doc = makeDoc();
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleCreateLink('mark-a', 'mark-b', 'supports');
      });
      expect(doc.argumentLinks).toHaveLength(1);

      act(() => {
        result.current.undo();
      });
      expect(doc.argumentLinks).toHaveLength(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('undoes link deletion by restoring the link', () => {
      const existingLink: ArgumentLink = {
        id: 'link-1',
        sourceMarkId: 'mark-a',
        targetMarkId: 'mark-b',
        linkType: 'rebuts',
        createdAt: 1000,
      };
      let doc = makeDoc({ argumentLinks: [existingLink] });
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleDeleteLink('link-1');
      });
      expect(doc.argumentLinks).toHaveLength(0);

      act(() => {
        result.current.undo();
      });
      expect(doc.argumentLinks).toHaveLength(1);
      expect(doc.argumentLinks![0].id).toBe('link-1');
      expect(doc.argumentLinks![0].linkType).toBe('rebuts');
    });

    it('undoes thesis toggle (add → remove)', () => {
      let doc = makeDoc({ thesisMarkIds: [] });
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleToggleThesis('mark-x');
      });
      expect(doc.thesisMarkIds).toContain('mark-x');

      act(() => {
        result.current.undo();
      });
      expect(doc.thesisMarkIds).not.toContain('mark-x');
    });

    it('undoes thesis toggle (remove → add)', () => {
      let doc = makeDoc({ thesisMarkIds: ['mark-x'] });
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleToggleThesis('mark-x');
      });
      expect(doc.thesisMarkIds).not.toContain('mark-x');

      act(() => {
        result.current.undo();
      });
      expect(doc.thesisMarkIds).toContain('mark-x');
    });

    it('does nothing when undo stack is empty', () => {
      let doc = makeDoc();
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.undo();
      });

      // setDoc should not be called for the undo (only the setState for undoStack runs)
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('redo', () => {
    it('redoes an undone link creation', () => {
      let doc = makeDoc();
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleCreateLink('mark-a', 'mark-b', 'supports');
      });
      const linkId = doc.argumentLinks![0].id;

      act(() => {
        result.current.undo();
      });
      expect(doc.argumentLinks).toHaveLength(0);

      act(() => {
        result.current.redo();
      });
      expect(doc.argumentLinks).toHaveLength(1);
      expect(doc.argumentLinks![0].id).toBe(linkId);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('redoes an undone link deletion', () => {
      const existingLink: ArgumentLink = {
        id: 'link-1',
        sourceMarkId: 'mark-a',
        targetMarkId: 'mark-b',
        linkType: 'supports',
        createdAt: 1000,
      };
      let doc = makeDoc({ argumentLinks: [existingLink] });
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleDeleteLink('link-1');
      });
      act(() => {
        result.current.undo();
      });
      expect(doc.argumentLinks).toHaveLength(1);

      act(() => {
        result.current.redo();
      });
      expect(doc.argumentLinks).toHaveLength(0);
    });

    it('does nothing when redo stack is empty', () => {
      let doc = makeDoc();
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.redo();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('redo stack clearing', () => {
    it('clears redo stack when a new action is performed', () => {
      let doc = makeDoc();
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleCreateLink('mark-a', 'mark-b', 'supports');
      });
      act(() => {
        result.current.undo();
      });
      expect(result.current.canRedo).toBe(true);

      // New action should clear redo
      act(() => {
        result.current.handleToggleThesis('mark-x');
      });
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('multiple undo/redo', () => {
    it('supports undoing and redoing multiple actions', () => {
      let doc = makeDoc();
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      // Action 1: create link
      act(() => {
        result.current.handleCreateLink('a', 'b', 'supports');
      });
      // Action 2: toggle thesis
      act(() => {
        result.current.handleToggleThesis('mark-t');
      });

      expect(doc.argumentLinks).toHaveLength(1);
      expect(doc.thesisMarkIds).toContain('mark-t');

      // Undo action 2
      act(() => {
        result.current.undo();
      });
      expect(doc.thesisMarkIds).not.toContain('mark-t');
      expect(doc.argumentLinks).toHaveLength(1);

      // Undo action 1
      act(() => {
        result.current.undo();
      });
      expect(doc.argumentLinks).toHaveLength(0);

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);

      // Redo action 1
      act(() => {
        result.current.redo();
      });
      expect(doc.argumentLinks).toHaveLength(1);

      // Redo action 2
      act(() => {
        result.current.redo();
      });
      expect(doc.thesisMarkIds).toContain('mark-t');

      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('handleDeleteLinks', () => {
    it('removes multiple links in a single update', () => {
      const link1: ArgumentLink = {
        id: 'link-1',
        sourceMarkId: 'mark-a',
        targetMarkId: 'mark-b',
        linkType: 'supports',
        createdAt: 1000,
      };
      const link2: ArgumentLink = {
        id: 'link-2',
        sourceMarkId: 'mark-c',
        targetMarkId: 'mark-d',
        linkType: 'rebuts',
        createdAt: 2000,
      };
      const link3: ArgumentLink = {
        id: 'link-3',
        sourceMarkId: 'mark-e',
        targetMarkId: 'mark-f',
        linkType: 'supports',
        createdAt: 3000,
      };
      let doc = makeDoc({ argumentLinks: [link1, link2, link3] });
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
        else doc = updater as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleDeleteLinks(['link-1', 'link-3']);
      });

      expect(doc.argumentLinks).toHaveLength(1);
      expect(doc.argumentLinks![0].id).toBe('link-2');
      expect(result.current.canUndo).toBe(true);
    });

    it('undoes a batch link deletion as a single step', () => {
      const link1: ArgumentLink = {
        id: 'link-1',
        sourceMarkId: 'mark-a',
        targetMarkId: 'mark-b',
        linkType: 'supports',
        createdAt: 1000,
      };
      const link2: ArgumentLink = {
        id: 'link-2',
        sourceMarkId: 'mark-c',
        targetMarkId: 'mark-d',
        linkType: 'rebuts',
        createdAt: 2000,
      };
      let doc = makeDoc({ argumentLinks: [link1, link2] });
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
        else doc = updater as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleDeleteLinks(['link-1', 'link-2']);
      });
      expect(doc.argumentLinks).toHaveLength(0);

      act(() => {
        result.current.undo();
      });
      expect(doc.argumentLinks).toHaveLength(2);
      expect(doc.argumentLinks!.map(l => l.id).sort()).toEqual(['link-1', 'link-2']);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('redoes a batch link deletion as a single step', () => {
      const link1: ArgumentLink = {
        id: 'link-1',
        sourceMarkId: 'mark-a',
        targetMarkId: 'mark-b',
        linkType: 'supports',
        createdAt: 1000,
      };
      const link2: ArgumentLink = {
        id: 'link-2',
        sourceMarkId: 'mark-c',
        targetMarkId: 'mark-d',
        linkType: 'rebuts',
        createdAt: 2000,
      };
      let doc = makeDoc({ argumentLinks: [link1, link2] });
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
        else doc = updater as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleDeleteLinks(['link-1', 'link-2']);
      });
      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.redo();
      });

      expect(doc.argumentLinks).toHaveLength(0);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('delegates to handleDeleteLink when only one link is provided', () => {
      const link1: ArgumentLink = {
        id: 'link-1',
        sourceMarkId: 'mark-a',
        targetMarkId: 'mark-b',
        linkType: 'supports',
        createdAt: 1000,
      };
      let doc = makeDoc({ argumentLinks: [link1] });
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
        else doc = updater as DebateDocument;
      });

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleDeleteLinks(['link-1']);
      });

      expect(doc.argumentLinks).toHaveLength(0);
      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('handleReplaceLinks', () => {
    it('deletes and creates links in a single update', () => {
      const linkA: ArgumentLink = {
        id: 'link-a',
        sourceMarkId: 'mark-b',
        targetMarkId: 'mark-a',
        linkType: 'supports',
        createdAt: 1000,
      };
      const linkB: ArgumentLink = {
        id: 'link-b',
        sourceMarkId: 'mark-c',
        targetMarkId: 'mark-b',
        linkType: 'supports',
        createdAt: 2000,
      };
      let doc = makeDoc({ argumentLinks: [linkA, linkB] });
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
        else doc = updater as DebateDocument;
      });

      const newLink: ArgumentLink = {
        id: 'link-c',
        sourceMarkId: 'mark-c',
        targetMarkId: 'mark-a',
        linkType: 'supports',
        createdAt: 3000,
      };

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleReplaceLinks(['link-a', 'link-b'], [newLink]);
      });

      expect(doc.argumentLinks).toHaveLength(1);
      expect(doc.argumentLinks![0].id).toBe('link-c');
      expect(result.current.canUndo).toBe(true);
    });

    it('undoes a replace as a single step', () => {
      const linkA: ArgumentLink = {
        id: 'link-a',
        sourceMarkId: 'mark-b',
        targetMarkId: 'mark-a',
        linkType: 'supports',
        createdAt: 1000,
      };
      const linkB: ArgumentLink = {
        id: 'link-b',
        sourceMarkId: 'mark-c',
        targetMarkId: 'mark-b',
        linkType: 'supports',
        createdAt: 2000,
      };
      let doc = makeDoc({ argumentLinks: [linkA, linkB] });
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
        else doc = updater as DebateDocument;
      });

      const newLink: ArgumentLink = {
        id: 'link-c',
        sourceMarkId: 'mark-c',
        targetMarkId: 'mark-a',
        linkType: 'supports',
        createdAt: 3000,
      };

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleReplaceLinks(['link-a', 'link-b'], [newLink]);
      });
      expect(doc.argumentLinks).toHaveLength(1);

      act(() => {
        result.current.undo();
      });

      expect(doc.argumentLinks).toHaveLength(2);
      expect(doc.argumentLinks!.map(l => l.id).sort()).toEqual(['link-a', 'link-b']);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('redoes a replace as a single step', () => {
      const linkA: ArgumentLink = {
        id: 'link-a',
        sourceMarkId: 'mark-b',
        targetMarkId: 'mark-a',
        linkType: 'supports',
        createdAt: 1000,
      };
      const linkB: ArgumentLink = {
        id: 'link-b',
        sourceMarkId: 'mark-c',
        targetMarkId: 'mark-b',
        linkType: 'supports',
        createdAt: 2000,
      };
      let doc = makeDoc({ argumentLinks: [linkA, linkB] });
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
        else doc = updater as DebateDocument;
      });

      const newLink: ArgumentLink = {
        id: 'link-c',
        sourceMarkId: 'mark-c',
        targetMarkId: 'mark-a',
        linkType: 'supports',
        createdAt: 3000,
      };

      const { result } = renderHook(() => useMapHistory(doc, setDoc));

      act(() => {
        result.current.handleReplaceLinks(['link-a', 'link-b'], [newLink]);
      });
      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.redo();
      });

      expect(doc.argumentLinks).toHaveLength(1);
      expect(doc.argumentLinks![0].id).toBe('link-c');
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('document switch', () => {
    it('clears history when document id changes', () => {
      let doc = makeDoc({ id: 'doc-1' });
      const setDoc = jest.fn((updater: React.SetStateAction<DebateDocument | null>) => {
        if (typeof updater === 'function') doc = updater(doc) as DebateDocument;
      });

      const { result, rerender } = renderHook(
        ({ currentDoc }) => useMapHistory(currentDoc, setDoc),
        { initialProps: { currentDoc: doc as DebateDocument | null } }
      );

      act(() => {
        result.current.handleCreateLink('a', 'b', 'supports');
      });
      expect(result.current.canUndo).toBe(true);

      // Switch to a different document
      const doc2 = makeDoc({ id: 'doc-2' });
      rerender({ currentDoc: doc2 });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });
});
