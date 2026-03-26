import { Editor, Transforms, Element as SlateElement, Range, Node } from 'slate';
import {
  CustomEditor,
  MarkType,
  BlockType,
  CustomElement,
  FallacyMark,
  RhetoricMark,
  StructuralMark,
  CommentMark,
  CustomText,
  ParagraphElement,
  BlockQuoteElement,
} from './types';

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
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === blockType,
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
    { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
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

  // Check if this fallacy is already applied - if so, remove it (toggle)
  const alreadyApplied = existingFallacyMarks.some(m => m.fallacyId === fallacyId);
  if (alreadyApplied) {
    // Remove this specific fallacy from the marks
    const updatedMarks = existingFallacyMarks.filter(m => m.fallacyId !== fallacyId);
    if (updatedMarks.length === 0) {
      Editor.removeMark(editor, 'fallacyMarks');
      Editor.removeMark(editor, 'fallacyId');
      Editor.removeMark(editor, 'fallacyColor');
    } else {
      Editor.addMark(editor, 'fallacyMarks', updatedMarks);
      // Update primary display to last remaining fallacy
      const lastMark = updatedMarks[updatedMarks.length - 1];
      Editor.addMark(editor, 'fallacyId', lastMark.fallacyId);
      Editor.addMark(editor, 'fallacyColor', lastMark.color);
    }
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

  // Check if this rhetoric is already applied - if so, remove it (toggle)
  const alreadyApplied = existingRhetoricMarks.some(m => m.rhetoricId === rhetoricId);
  if (alreadyApplied) {
    // Remove this specific rhetoric from the marks
    const updatedMarks = existingRhetoricMarks.filter(m => m.rhetoricId !== rhetoricId);
    if (updatedMarks.length === 0) {
      Editor.removeMark(editor, 'rhetoricMarks');
    } else {
      Editor.addMark(editor, 'rhetoricMarks', updatedMarks);
    }
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
 * Apply a structural markup annotation to the current selection
 * Supports multiple structural marks on the same text range
 */
export function applyStructuralMark(
  editor: CustomEditor,
  markupId: string,
  markupColor: string,
  metadata?: StructuralMark['metadata']
): { start: number; end: number } | null {
  const { selection } = editor;
  if (!selection || Range.isCollapsed(selection)) {
    return null;
  }

  // Get the absolute offsets for the annotation
  const [start, end] = Range.edges(selection);
  const startOffset = Editor.point(editor, start, { edge: 'start' });
  const endOffset = Editor.point(editor, end, { edge: 'end' });

  // Get existing marks to preserve multiple structural marks
  const marks = Editor.marks(editor);
  const existingStructuralMarks: StructuralMark[] = marks?.structuralMarks || [];

  // Check if this markup is already applied
  const existingMarkIndex = existingStructuralMarks.findIndex(m => m.markupId === markupId);
  const alreadyApplied = existingMarkIndex !== -1;

  if (alreadyApplied) {
    // Check if metadata is provided (could be with values, or empty to clear)
    if (metadata !== undefined) {
      const hasValues = Object.values(metadata).some(v => v);
      const updatedMarks = [...existingStructuralMarks];
      updatedMarks[existingMarkIndex] = {
        ...updatedMarks[existingMarkIndex],
        // If metadata has values, use it; otherwise clear metadata by setting undefined
        metadata: hasValues ? metadata : undefined,
        appliedAt: Date.now(), // Update timestamp
      };
      Editor.addMark(editor, 'structuralMarks', updatedMarks);
      return {
        start: startOffset.offset,
        end: endOffset.offset,
      };
    }

    // No metadata provided (undefined) - toggle OFF (remove) the markup
    const updatedMarks = existingStructuralMarks.filter(m => m.markupId !== markupId);
    if (updatedMarks.length === 0) {
      Editor.removeMark(editor, 'structuralMarks');
    } else {
      Editor.addMark(editor, 'structuralMarks', updatedMarks);
    }
    return null;
  }

  // Mutually exclusive markup pairs - applying one removes the other
  const mutuallyExclusive: Record<string, string> = {
    claim: 'unsupported',
    unsupported: 'claim',
  };

  // Remove conflicting markup if present
  let filteredMarks = existingStructuralMarks;
  const conflicting = mutuallyExclusive[markupId];
  if (conflicting) {
    filteredMarks = existingStructuralMarks.filter(m => m.markupId !== conflicting);
  }

  // Create new structural mark
  const newMark: StructuralMark = {
    id: `struct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    markupId,
    color: markupColor,
    appliedAt: Date.now(),
    metadata,
  };

  // Add to the array of structural marks
  const updatedMarks = [...filteredMarks, newMark];
  Editor.addMark(editor, 'structuralMarks', updatedMarks);

  return {
    start: startOffset.offset,
    end: endOffset.offset,
  };
}

/**
 * Remove structural markup annotation from the current selection
 */
export function removeStructuralMark(editor: CustomEditor): void {
  Editor.removeMark(editor, 'structuralMarks');
}

/**
 * Get structural marks at current cursor position
 */
export function getStructuralMarksAtSelection(editor: CustomEditor): StructuralMark[] {
  const marks = Editor.marks(editor);
  return marks?.structuralMarks || [];
}

/**
 * Apply a comment mark to the current selection
 */
export function applyCommentMark(
  editor: CustomEditor,
  commentId: string
): { start: number; end: number } | null {
  const { selection } = editor;
  if (!selection || Range.isCollapsed(selection)) {
    return null;
  }

  const [start, end] = Range.edges(selection);
  const startOffset = Editor.point(editor, start, { edge: 'start' });
  const endOffset = Editor.point(editor, end, { edge: 'end' });

  const marks = Editor.marks(editor);
  const existingCommentMarks: CommentMark[] = marks?.commentMarks || [];

  // Don't add duplicate comment marks
  if (existingCommentMarks.some(m => m.commentId === commentId)) {
    return null;
  }

  const newMark: CommentMark = {
    id: `comment_mark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    commentId,
    appliedAt: Date.now(),
  };

  const updatedMarks = [...existingCommentMarks, newMark];
  Editor.addMark(editor, 'commentMarks', updatedMarks);

  return {
    start: startOffset.offset,
    end: endOffset.offset,
  };
}

/**
 * Remove a specific comment mark from the entire document
 */
export function removeCommentMark(editor: CustomEditor, commentId: string): void {
  const textNodes = Array.from(Node.texts(editor));
  for (const [node, path] of textNodes) {
    const textNode = node as CustomText;
    if (textNode.commentMarks?.some(m => m.commentId === commentId)) {
      const updatedMarks = textNode.commentMarks.filter(m => m.commentId !== commentId);
      if (updatedMarks.length === 0) {
        Transforms.unsetNodes(editor, 'commentMarks', { at: path });
      } else {
        Transforms.setNodes(editor, { commentMarks: updatedMarks } as Partial<CustomText>, {
          at: path,
        });
      }
    }
  }
}

/**
 * Get comment marks at current cursor position
 */
export function getCommentMarksAtSelection(editor: CustomEditor): CommentMark[] {
  const marks = Editor.marks(editor);
  return marks?.commentMarks || [];
}

/**
 * Clear all annotations (fallacies, rhetoric, and structural) from the current selection
 */
export function clearAllAnnotations(editor: CustomEditor): void {
  Editor.removeMark(editor, 'fallacyMarks');
  Editor.removeMark(editor, 'fallacyId');
  Editor.removeMark(editor, 'fallacyColor');
  Editor.removeMark(editor, 'rhetoricMarks');
  Editor.removeMark(editor, 'structuralMarks');
}

/**
 * Clear all regular formatting (bold, italic, underline, strikethrough) from the current selection
 */
export function clearAllFormatting(editor: CustomEditor): void {
  Editor.removeMark(editor, 'bold');
  Editor.removeMark(editor, 'italic');
  Editor.removeMark(editor, 'underline');
  Editor.removeMark(editor, 'strikethrough');
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
export function countAnnotationsByFallacy(editor: CustomEditor): Record<string, number> {
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
export function selectNextAnnotation(editor: CustomEditor, currentFallacyId?: string): boolean {
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
export function selectPreviousAnnotation(editor: CustomEditor, currentFallacyId?: string): boolean {
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

/**
 * Assign a speaker to the block(s) at the current selection
 * If toggle is true and the block already has this speaker, remove the speaker
 */
export function assignSpeakerToSelection(
  editor: CustomEditor,
  speakerId: string | null,
  toggle: boolean = false
): void {
  const { selection } = editor;
  if (!selection) return;

  // Get all block nodes in the selection
  const blocks = Array.from(
    Editor.nodes(editor, {
      at: selection,
      match: n => SlateElement.isElement(n) && (n.type === 'paragraph' || n.type === 'block-quote'),
    })
  );

  // Update each block with the speaker ID
  for (const [node, path] of blocks) {
    const currentSpeakerId = (node as ParagraphElement | BlockQuoteElement).speakerId;

    // If toggle mode and same speaker, remove it
    if (toggle && speakerId !== null && currentSpeakerId === speakerId) {
      Transforms.unsetNodes(editor, 'speakerId', { at: path });
    } else if (speakerId === null) {
      Transforms.unsetNodes(editor, 'speakerId', { at: path });
    } else {
      Transforms.setNodes(editor, { speakerId } as Partial<ParagraphElement | BlockQuoteElement>, {
        at: path,
      });
    }
  }
}

/**
 * Get the speaker ID of the block at the current cursor position
 */
export function getSpeakerAtSelection(editor: CustomEditor): string | null {
  const { selection } = editor;
  if (!selection) return null;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: selection,
      match: n =>
        SlateElement.isElement(n) &&
        (n.type === 'paragraph' || n.type === 'block-quote') &&
        'speakerId' in n,
    })
  );

  if (match) {
    const [node] = match;
    return (node as ParagraphElement | BlockQuoteElement).speakerId || null;
  }

  return null;
}

/**
 * Get all unique speaker IDs used in the document
 */
export function getUsedSpeakerIds(editor: CustomEditor): string[] {
  const speakerIds = new Set<string>();

  const blocks = Array.from(
    Editor.nodes(editor, {
      at: [],
      match: n =>
        SlateElement.isElement(n) &&
        (n.type === 'paragraph' || n.type === 'block-quote') &&
        'speakerId' in n &&
        typeof (n as ParagraphElement | BlockQuoteElement).speakerId === 'string',
    })
  );

  for (const [node] of blocks) {
    const speakerId = (node as ParagraphElement | BlockQuoteElement).speakerId;
    if (speakerId) {
      speakerIds.add(speakerId);
    }
  }

  return Array.from(speakerIds);
}
