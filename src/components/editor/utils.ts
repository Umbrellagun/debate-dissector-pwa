import { Editor, Transforms, Element as SlateElement, Range, Text, Node } from 'slate';
import { CustomEditor, MarkType, BlockType, CustomElement, FallacyMark, RhetoricMark, CustomText } from './types';

/**
 * Check if a mark is active at the current selection
 */
export function isMarkActive(editor: CustomEditor, mark: MarkType): boolean {
  const marks = Editor.marks(editor);
  return marks ? marks[mark] === true : false;
}

/**
 * Toggle a mark on the current selection
 */
export function toggleMark(editor: CustomEditor, mark: MarkType): void {
  const isActive = isMarkActive(editor, mark);
  if (isActive) {
    Editor.removeMark(editor, mark);
  } else {
    Editor.addMark(editor, mark, true);
  }
}

/**
 * Check if a block type is active at the current selection
 */
export function isBlockActive(editor: CustomEditor, blockType: BlockType): boolean {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === blockType,
    })
  );

  return !!match;
}

/**
 * Toggle a block type on the current selection
 */
export function toggleBlock(editor: CustomEditor, blockType: BlockType): void {
  const isActive = isBlockActive(editor, blockType);
  const newType = isActive ? 'paragraph' : blockType;

  Transforms.setNodes<CustomElement>(
    editor,
    { type: newType },
    { match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
  );
}

/**
 * Apply a fallacy annotation to the current selection
 * Supports multiple fallacies on the same text range
 */
export function applyFallacyMark(
  editor: CustomEditor,
  fallacyId: string,
  fallacyColor: string
): { start: number; end: number } | null {
  const { selection } = editor;
  if (!selection || Range.isCollapsed(selection)) {
    return null;
  }

  // Get the absolute offsets for the annotation
  const [start, end] = Range.edges(selection);
  const startOffset = Editor.point(editor, start, { edge: 'start' });
  const endOffset = Editor.point(editor, end, { edge: 'end' });

  // Get existing marks to preserve multiple fallacies
  const marks = Editor.marks(editor);
  const existingFallacyMarks: FallacyMark[] = marks?.fallacyMarks || [];
  
  // Check if this fallacy is already applied
  const alreadyApplied = existingFallacyMarks.some(m => m.fallacyId === fallacyId);
  if (alreadyApplied) {
    return null;
  }

  // Create new fallacy mark
  const newMark: FallacyMark = {
    id: `mark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    fallacyId,
    color: fallacyColor,
    appliedAt: Date.now(),
  };

  // Add to the array of fallacy marks
  const updatedMarks = [...existingFallacyMarks, newMark];
  Editor.addMark(editor, 'fallacyMarks', updatedMarks);
  
  // Also set the primary display color (latest fallacy)
  Editor.addMark(editor, 'fallacyId', fallacyId);
  Editor.addMark(editor, 'fallacyColor', fallacyColor);

  return {
    start: startOffset.offset,
    end: endOffset.offset,
  };
}

/**
 * Remove fallacy annotation from the current selection
 */
export function removeFallacyMark(editor: CustomEditor): void {
  Editor.removeMark(editor, 'fallacyId');
  Editor.removeMark(editor, 'fallacyColor');
}

/**
 * Apply a rhetoric annotation to the current selection
 * Supports multiple rhetoric techniques on the same text range
 */
export function applyRhetoricMark(
  editor: CustomEditor,
  rhetoricId: string,
  rhetoricColor: string
): { start: number; end: number } | null {
  const { selection } = editor;
  if (!selection || Range.isCollapsed(selection)) {
    return null;
  }

  // Get the absolute offsets for the annotation
  const [start, end] = Range.edges(selection);
  const startOffset = Editor.point(editor, start, { edge: 'start' });
  const endOffset = Editor.point(editor, end, { edge: 'end' });

  // Get existing marks to preserve multiple rhetoric techniques
  const marks = Editor.marks(editor);
  const existingRhetoricMarks: RhetoricMark[] = marks?.rhetoricMarks || [];
  
  // Check if this rhetoric is already applied
  const alreadyApplied = existingRhetoricMarks.some(m => m.rhetoricId === rhetoricId);
  if (alreadyApplied) {
    return null;
  }

  // Create new rhetoric mark
  const newMark: RhetoricMark = {
    id: `mark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    rhetoricId,
    color: rhetoricColor,
    appliedAt: Date.now(),
  };

  // Add to the array of rhetoric marks
  const updatedMarks = [...existingRhetoricMarks, newMark];
  Editor.addMark(editor, 'rhetoricMarks', updatedMarks);

  return {
    start: startOffset.offset,
    end: endOffset.offset,
  };
}

/**
 * Remove rhetoric annotation from the current selection
 */
export function removeRhetoricMark(editor: CustomEditor): void {
  Editor.removeMark(editor, 'rhetoricMarks');
}

/**
 * Get the current selection text
 */
export function getSelectionText(editor: CustomEditor): string {
  const { selection } = editor;
  if (!selection) return '';
  return Editor.string(editor, selection);
}

/**
 * Check if there is a non-collapsed selection
 */
export function hasSelection(editor: CustomEditor): boolean {
  const { selection } = editor;
  return selection !== null && !Range.isCollapsed(selection);
}

/**
 * Get fallacy info at current cursor position
 */
export function getFallacyAtSelection(
  editor: CustomEditor
): { fallacyId: string; fallacyColor: string } | null {
  const marks = Editor.marks(editor);
  if (marks?.fallacyId && marks?.fallacyColor) {
    return {
      fallacyId: marks.fallacyId,
      fallacyColor: marks.fallacyColor,
    };
  }
  return null;
}

/**
 * Count words in the editor content
 */
export function countWords(editor: CustomEditor): number {
  const text = Editor.string(editor, []);
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Count characters in the editor content
 */
export function countCharacters(editor: CustomEditor): number {
  return Editor.string(editor, []).length;
}

/**
 * Get all annotations from the editor content
 */
export function getAllAnnotations(
  editor: CustomEditor
): Array<{ fallacyId: string; fallacyColor: string; text: string }> {
  const annotations: Array<{ fallacyId: string; fallacyColor: string; text: string }> = [];

  const textNodes = Array.from(Node.texts(editor));
  for (const [node] of textNodes) {
    const textNode = node as CustomText;
    if (textNode.fallacyId && textNode.fallacyColor) {
      annotations.push({
        fallacyId: textNode.fallacyId,
        fallacyColor: textNode.fallacyColor,
        text: textNode.text,
      });
    }
  }

  return annotations;
}

/**
 * Count annotations by fallacy type
 */
export function countAnnotationsByFallacy(
  editor: CustomEditor
): Record<string, number> {
  const counts: Record<string, number> = {};

  const textNodes = Array.from(Node.texts(editor));
  for (const [node] of textNodes) {
    const textNode = node as CustomText;
    if (textNode.fallacyId) {
      counts[textNode.fallacyId] = (counts[textNode.fallacyId] || 0) + 1;
    }
  }

  return counts;
}

/**
 * Find and select the next annotation in the document
 */
export function selectNextAnnotation(
  editor: CustomEditor,
  currentFallacyId?: string
): boolean {
  const { selection } = editor;
  let foundCurrent = !selection;
  const textNodes = Array.from(Node.texts(editor));
  
  for (const [node, path] of textNodes) {
    const textNode = node as CustomText;
    
    if (selection && !foundCurrent) {
      const nodeRange = Editor.range(editor, path);
      if (Range.includes(nodeRange, selection.anchor)) {
        foundCurrent = true;
        continue;
      }
    }
    
    if (foundCurrent && textNode.fallacyId) {
      if (!currentFallacyId || textNode.fallacyId === currentFallacyId) {
        const range = Editor.range(editor, path);
        Transforms.select(editor, range);
        return true;
      }
    }
  }

  // Wrap around to the beginning
  for (const [node, path] of textNodes) {
    const textNode = node as CustomText;
    if (textNode.fallacyId) {
      if (!currentFallacyId || textNode.fallacyId === currentFallacyId) {
        const range = Editor.range(editor, path);
        Transforms.select(editor, range);
        return true;
      }
    }
  }

  return false;
}

/**
 * Find and select the previous annotation in the document
 */
export function selectPreviousAnnotation(
  editor: CustomEditor,
  currentFallacyId?: string
): boolean {
  const { selection } = editor;
  const allAnnotations: Array<{ path: number[]; fallacyId: string }> = [];
  const textNodes = Array.from(Node.texts(editor));

  for (const [node, path] of textNodes) {
    const textNode = node as CustomText;
    if (textNode.fallacyId) {
      if (!currentFallacyId || textNode.fallacyId === currentFallacyId) {
        allAnnotations.push({ path: path as number[], fallacyId: textNode.fallacyId });
      }
    }
  }

  if (allAnnotations.length === 0) return false;

  let targetIndex = allAnnotations.length - 1;

  if (selection) {
    for (let i = 0; i < allAnnotations.length; i++) {
      const nodeRange = Editor.range(editor, allAnnotations[i].path);
      if (Range.includes(nodeRange, selection.anchor)) {
        targetIndex = i > 0 ? i - 1 : allAnnotations.length - 1;
        break;
      }
    }
  }

  const target = allAnnotations[targetIndex];
  const range = Editor.range(editor, target.path);
  Transforms.select(editor, range);
  return true;
}
