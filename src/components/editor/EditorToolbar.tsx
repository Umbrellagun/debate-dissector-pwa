import React from 'react';
import { useSlate } from 'slate-react';
import { CustomEditor, MarkType, BlockType } from './types';
import { isMarkActive, toggleMark, isBlockActive, toggleBlock, clearAllAnnotations, clearAllFormatting } from './utils';

interface ToolbarButtonProps {
  active: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  title: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  active,
  onMouseDown,
  children,
  title,
}) => (
  <button
    type="button"
    onMouseDown={onMouseDown}
    title={title}
    aria-label={title}
    aria-pressed={active}
    className={`p-2 rounded hover:bg-gray-200 transition-colors ${
      active ? 'bg-gray-200 text-blue-600' : 'text-gray-600'
    }`}
  >
    {children}
  </button>
);

interface MarkButtonProps {
  mark: MarkType;
  icon: React.ReactNode;
  title: string;
}

const MarkButton: React.FC<MarkButtonProps> = ({ mark, icon, title }) => {
  const editor = useSlate() as CustomEditor;
  return (
    <ToolbarButton
      active={isMarkActive(editor, mark)}
      onMouseDown={(e) => {
        e.preventDefault();
        toggleMark(editor, mark);
      }}
      title={title}
    >
      {icon}
    </ToolbarButton>
  );
};

interface BlockButtonProps {
  block: BlockType;
  icon: React.ReactNode;
  title: string;
}

const BlockButton: React.FC<BlockButtonProps> = ({ block, icon, title }) => {
  const editor = useSlate() as CustomEditor;
  return (
    <ToolbarButton
      active={isBlockActive(editor, block)}
      onMouseDown={(e) => {
        e.preventDefault();
        toggleBlock(editor, block);
      }}
      title={title}
    >
      {icon}
    </ToolbarButton>
  );
};

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

const StrikeIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z" />
  </svg>
);

const H1Icon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <text x="2" y="17" fontSize="14" fontWeight="bold">H1</text>
  </svg>
);

const H2Icon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <text x="2" y="17" fontSize="14" fontWeight="bold">H2</text>
  </svg>
);

const QuoteIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
  </svg>
);

const ClearFormattingIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <text x="2" y="16" fontSize="14" fontWeight="bold">T</text>
    <text x="12" y="18" fontSize="10" fontWeight="bold">x</text>
  </svg>
);

const ClearFormattingButton: React.FC = () => {
  const editor = useSlate() as CustomEditor;
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        clearAllFormatting(editor);
      }}
      title="Clear Formatting"
      aria-label="Clear all formatting from selected text"
      className="p-2 rounded hover:bg-orange-100 transition-colors text-gray-600 hover:text-orange-600"
    >
      <ClearFormattingIcon />
    </button>
  );
};

const ClearAnnotationsButton: React.FC = () => {
  const editor = useSlate() as CustomEditor;
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        clearAllAnnotations(editor);
      }}
      title="Remove ALL highlights from Selected Text"
      aria-label="Remove all annotation highlights from selected text"
      className="px-2 py-1.5 rounded text-xs font-medium bg-gray-100 hover:bg-red-100 transition-colors text-gray-600 hover:text-red-600"
    >
      Remove ALL Highlights
    </button>
  );
};

export interface PinnedAnnotation {
  id: string;
  name: string;
  color: string;
  type: 'fallacy' | 'rhetoric';
}

export interface PinnedSpeaker {
  id: string;
  name: string;
  color: string;
}

interface EditorToolbarProps {
  selectedAnnotation?: { name: string; color: string } | null;
  hasTextSelection?: boolean;
  onApplyAnnotation?: () => void;
  pinnedAnnotations?: PinnedAnnotation[];
  onApplyPinnedAnnotation?: (annotation: PinnedAnnotation) => void;
  pinnedSpeakers?: PinnedSpeaker[];
  onAssignPinnedSpeaker?: (speakerId: string) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  selectedAnnotation,
  hasTextSelection,
  onApplyAnnotation,
  pinnedAnnotations = [],
  onApplyPinnedAnnotation,
  pinnedSpeakers = [],
  onAssignPinnedSpeaker,
}) => {
  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-200 bg-gray-50 flex-wrap" role="toolbar" aria-label="Text formatting options">
      <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-1">
        <MarkButton mark="bold" icon={<BoldIcon />} title="Bold (Ctrl+B)" />
        <MarkButton mark="italic" icon={<ItalicIcon />} title="Italic (Ctrl+I)" />
        <MarkButton mark="underline" icon={<UnderlineIcon />} title="Underline (Ctrl+U)" />
        <MarkButton mark="strikethrough" icon={<StrikeIcon />} title="Strikethrough" />
      </div>
      <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-1">
        <BlockButton block="heading-one" icon={<H1Icon />} title="Heading 1" />
        <BlockButton block="heading-two" icon={<H2Icon />} title="Heading 2" />
        <BlockButton block="block-quote" icon={<QuoteIcon />} title="Block Quote" />
      </div>
      <div className="flex items-center gap-1">
        <ClearFormattingButton />
        <ClearAnnotationsButton />
      </div>
      {/* Pinned Annotation Shortcuts */}
      {pinnedAnnotations.length > 0 && (
        <div className="flex items-center gap-1 pl-2 border-l border-gray-300">
          {pinnedAnnotations.map((annotation) => (
            <button
              key={`${annotation.type}-${annotation.id}`}
              type="button"
              disabled={!hasTextSelection}
              onMouseDown={(e) => {
                e.preventDefault();
                if (hasTextSelection) {
                  onApplyPinnedAnnotation?.(annotation);
                }
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white shadow-sm transition-opacity touch-manipulation ${
                hasTextSelection ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'
              }`}
              style={{ backgroundColor: annotation.color }}
              title={hasTextSelection ? `Apply ${annotation.name} (${annotation.type})` : 'Select text first'}
              aria-label={`Apply or remove ${annotation.name} annotation`}
            >
              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 4a1 1 0 00-1.41 0L13 5.59 9.41 2a1 1 0 00-1.41 0L6 4a1 1 0 000 1.41L7.59 7 4 10.59a1 1 0 000 1.41l2 2a1 1 0 001.41 0L11 10.41 12.59 12l-5 5a1 1 0 000 1.41l2 2a1 1 0 001.41 0l5-5L17.59 17a1 1 0 001.41 0l2-2a1 1 0 000-1.41L17.41 10 21 6.41A1 1 0 0021 5l-2-2a1 1 0 00-1.41 0L14 6.59 12.41 5 16 1.41A1 1 0 0016 0V4z" />
              </svg>
              <span className="truncate max-w-[60px]">{annotation.name}</span>
            </button>
          ))}
        </div>
      )}
      {/* Pinned Speaker Shortcuts */}
      {pinnedSpeakers.length > 0 && (
        <div className="flex items-center gap-1 pl-2 border-l border-gray-300">
          {pinnedSpeakers.map((speaker) => (
            <button
              key={`speaker-${speaker.id}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onAssignPinnedSpeaker?.(speaker.id);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white shadow-sm hover:opacity-90 transition-opacity touch-manipulation"
              style={{ backgroundColor: speaker.color }}
              title={`Assign ${speaker.name} to current paragraph`}
              aria-label={`Assign speaker ${speaker.name}`}
            >
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="truncate max-w-[60px]">{speaker.name}</span>
            </button>
          ))}
        </div>
      )}
      {/* Apply Annotation Button - shows when text is selected and annotation is chosen */}
      {hasTextSelection && selectedAnnotation && onApplyAnnotation && (
        <div className="flex items-center ml-auto pl-2 border-l border-gray-300">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onApplyAnnotation();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white shadow-sm touch-manipulation"
            style={{ backgroundColor: selectedAnnotation.color }}
            title={`Apply ${selectedAnnotation.name}`}
            aria-label={`Apply or remove ${selectedAnnotation.name} annotation`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="hidden sm:inline">Add/Remove</span>
            <span className="truncate max-w-[100px]">{selectedAnnotation.name}</span>
          </button>
        </div>
      )}
    </div>
  );
};
