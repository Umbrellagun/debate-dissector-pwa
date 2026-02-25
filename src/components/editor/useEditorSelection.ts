import { useState, useEffect, useCallback } from 'react';
import { Range } from 'slate';
import { ReactEditor } from 'slate-react';
import { CustomEditor } from './types';
import { getSelectionText, hasSelection } from './utils';

interface SelectionState {
  hasSelection: boolean;
  selectedText: string;
  selectionRect: DOMRect | null;
}

export function useEditorSelection(editor: CustomEditor | null): SelectionState {
  const [state, setState] = useState<SelectionState>({
    hasSelection: false,
    selectedText: '',
    selectionRect: null,
  });

  const updateSelection = useCallback(() => {
    if (!editor) {
      setState({ hasSelection: false, selectedText: '', selectionRect: null });
      return;
    }

    const { selection } = editor;
    if (!selection || Range.isCollapsed(selection)) {
      setState({ hasSelection: false, selectedText: '', selectionRect: null });
      return;
    }

    try {
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) {
        setState({ hasSelection: false, selectedText: '', selectionRect: null });
        return;
      }

      const domRange = domSelection.getRangeAt(0);
      const rect = domRange.getBoundingClientRect();

      setState({
        hasSelection: true,
        selectedText: getSelectionText(editor),
        selectionRect: rect,
      });
    } catch {
      setState({ hasSelection: false, selectedText: '', selectionRect: null });
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const handleSelectionChange = () => {
      // Small delay to ensure Slate has updated
      requestAnimationFrame(updateSelection);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [editor, updateSelection]);

  return state;
}
