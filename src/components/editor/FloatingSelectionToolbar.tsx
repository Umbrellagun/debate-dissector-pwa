import React, { useEffect, useRef, useState } from 'react';
import { useSlate } from 'slate-react';
import { Range, Editor } from 'slate';
import { CustomEditor, MarkType } from './types';
import { isMarkActive, toggleMark } from './utils';
import { PinnedAnnotation } from './EditorToolbar';

interface FloatingSelectionToolbarProps {
  onOpenAnnotations?: () => void;
  onRequestComment?: () => void;
  selectedAnnotation?: { name: string; color: string } | null;
  onApplyAnnotation?: () => void;
  pinnedAnnotations?: PinnedAnnotation[];
  onApplyPinnedAnnotation?: (annotation: PinnedAnnotation) => void;
}

// --- Icons ---

const BoldIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
  </svg>
);

const ItalicIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
  </svg>
);

const UnderlineIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
  </svg>
);

const AnnotateIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

const CommentIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 8h10M7 12h6m-3 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
    />
  </svg>
);

// --- Formatting button helper ---

const FormatButton: React.FC<{
  editor: CustomEditor;
  mark: MarkType;
  icon: React.ReactNode;
  title: string;
}> = ({ editor, mark, icon, title }) => {
  const active = isMarkActive(editor, mark);
  return (
    <button
      type="button"
      onMouseDown={e => {
        e.preventDefault();
        toggleMark(editor, mark);
      }}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`p-1.5 rounded transition-colors ${
        active ? 'bg-violet-100 text-violet-600' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
    </button>
  );
};

// --- Main component ---

export const FloatingSelectionToolbar: React.FC<FloatingSelectionToolbarProps> = ({
  onOpenAnnotations,
  onRequestComment,
  selectedAnnotation,
  onApplyAnnotation,
  pinnedAnnotations = [],
  onApplyPinnedAnnotation,
}) => {
  const editor = useSlate() as CustomEditor;
  const ref = useRef<HTMLDivElement>(null);
  const isPointerDownRef = useRef(false);
  const [, forceRender] = useState(0);

  // Track pointer state: hide toolbar during active selection drag
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      // Ignore pointer events on the toolbar itself
      if (ref.current?.contains(e.target as Node)) return;
      isPointerDownRef.current = true;
    };
    const onUp = () => {
      if (isPointerDownRef.current) {
        isPointerDownRef.current = false;
        // Force re-render so the positioning effect runs after pointer release
        forceRender(n => n + 1);
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
    };
  }, []);

  // Position the toolbar on every render (standard Slate hovering toolbar pattern).
  // useSlate() triggers re-renders on editor changes; the pointerup handler
  // forces an additional re-render so the toolbar appears after mouse release.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { selection } = editor;

    const hide = () => {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
    };

    // Hide while pointer is down (user is actively selecting)
    if (isPointerDownRef.current) {
      hide();
      return;
    }

    // Hide if no selection or selection is collapsed
    if (!selection || Range.isCollapsed(selection)) {
      hide();
      return;
    }

    // Hide if selection contains no text
    const text = Editor.string(editor, selection);
    if (!text.trim()) {
      hide();
      return;
    }

    // Get DOM selection rect
    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) {
      hide();
      return;
    }

    const domRange = domSelection.getRangeAt(0);
    const rect = domRange.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) {
      hide();
      return;
    }

    // Measure toolbar for positioning
    const elRect = el.getBoundingClientRect();
    const gap = 8;

    // Prefer above; fall back to below if not enough space
    const above = rect.top > elRect.height + gap + 10;
    const top = Math.max(8, above ? rect.top - elRect.height - gap : rect.bottom + gap);

    // Center horizontally, clamped to viewport
    let left = rect.left + rect.width / 2 - elRect.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - elRect.width - 8));

    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
  });

  return (
    <div
      ref={ref}
      className="fixed z-[9999] flex items-center gap-0.5 px-1.5 py-1 bg-white rounded-lg shadow-lg border border-gray-200 transition-opacity duration-150"
      style={{ top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
      onMouseDown={e => e.preventDefault()}
    >
      {/* Formatting */}
      <FormatButton editor={editor} mark="bold" icon={<BoldIcon />} title="Bold (Ctrl+B)" />
      <FormatButton editor={editor} mark="italic" icon={<ItalicIcon />} title="Italic (Ctrl+I)" />
      <FormatButton
        editor={editor}
        mark="underline"
        icon={<UnderlineIcon />}
        title="Underline (Ctrl+U)"
      />

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      {/* Comment */}
      <button
        type="button"
        onMouseDown={e => {
          e.preventDefault();
          onRequestComment?.();
        }}
        title="Add Comment"
        aria-label="Add comment"
        className="p-1.5 rounded text-amber-500 hover:bg-amber-50 transition-colors"
      >
        <CommentIcon />
      </button>

      {/* Pinned annotation shortcuts */}
      {pinnedAnnotations.length > 0 && (
        <>
          <div className="w-px h-5 bg-gray-200 mx-0.5" />
          {pinnedAnnotations.map(annotation => (
            <button
              key={`${annotation.type}-${annotation.id}`}
              type="button"
              onMouseDown={e => {
                e.preventDefault();
                onApplyPinnedAnnotation?.(annotation);
              }}
              className="flex items-center gap-0.5 px-1.5 py-1 rounded text-xs font-medium text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: annotation.color }}
              title={`Apply ${annotation.name}`}
              aria-label={`Apply ${annotation.name} annotation`}
            >
              <span className="max-w-[60px] truncate">{annotation.name}</span>
            </button>
          ))}
        </>
      )}

      {/* Quick-apply selected annotation */}
      {selectedAnnotation && onApplyAnnotation && (
        <>
          <div className="w-px h-5 bg-gray-200 mx-0.5" />
          <button
            type="button"
            onMouseDown={e => {
              e.preventDefault();
              onApplyAnnotation();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: selectedAnnotation.color }}
            title={`Apply ${selectedAnnotation.name}`}
            aria-label={`Apply ${selectedAnnotation.name}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="max-w-[80px] truncate hidden sm:inline">
              {selectedAnnotation.name}
            </span>
          </button>
        </>
      )}
    </div>
  );
};
