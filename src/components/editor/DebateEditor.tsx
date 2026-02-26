import React, { useCallback, useMemo, useImperativeHandle, forwardRef, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact, RenderLeafProps, RenderElementProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { CustomEditor, CustomText, CustomElement, DEFAULT_INITIAL_VALUE, FallacyMark } from './types';
import { EditorToolbar } from './EditorToolbar';
import { toggleMark } from './utils';
import { MarkType } from './types';
import { FALLACIES } from '../../data/fallacies';
import './types'; // Import type augmentation

// Helper to get fallacy name from ID
const getFallacyName = (fallacyId: string): string => {
  const fallacy = FALLACIES.find(f => f.id === fallacyId);
  return fallacy?.name || fallacyId;
};

// Tooltip component for showing multiple fallacies
interface FallacyTooltipProps {
  marks: FallacyMark[];
  onClose: () => void;
  anchorRect: DOMRect | null;
}

const FallacyTooltip: React.FC<FallacyTooltipProps> = ({ marks, onClose, anchorRect }) => {
  if (!anchorRect) return null;

  const estimatedHeight = marks.length * 24 + 50;
  const viewportHeight = window.innerHeight;
  const spaceAbove = anchorRect.top;
  const spaceBelow = viewportHeight - anchorRect.bottom;
  
  const showBelow = spaceAbove < estimatedHeight + 10 && spaceBelow > estimatedHeight;

  // Position directly above or below the badge with minimal gap
  const top = showBelow 
    ? anchorRect.bottom + 4 
    : anchorRect.top - estimatedHeight;

  const arrowStyles: React.CSSProperties = showBelow
    ? {
        top: '-5px',
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderBottom: '6px solid #1f2937',
      }
    : {
        bottom: '-5px',
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid #1f2937',
      };

  return (
    <div
      contentEditable={false}
      onClick={(e) => e.stopPropagation()}
      onMouseLeave={onClose}
      style={{
        position: 'fixed',
        left: anchorRect.left + anchorRect.width / 2,
        top: Math.max(10, top),
        transform: 'translateX(-50%)',
        backgroundColor: '#1f2937',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        zIndex: 10000,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        userSelect: 'none',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid #374151', paddingBottom: '4px' }}>
        Applied Fallacies:
      </div>
      {marks.map((mark, idx) => (
        <div key={mark.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: idx > 0 ? '4px' : 0 }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: mark.color,
              flexShrink: 0,
            }}
          />
          <span>{getFallacyName(mark.fallacyId)}</span>
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          ...arrowStyles,
        }}
      />
    </div>
  );
};

export interface DebateEditorHandle {
  getEditor: () => CustomEditor;
}

interface DebateEditorProps {
  initialValue?: Descendant[];
  onChange?: (value: Descendant[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const Leaf: React.FC<RenderLeafProps> = ({ attributes, children, leaf }) => {
  const customLeaf = leaf as CustomText;
  const [showTooltip, setShowTooltip] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  let style: React.CSSProperties = {};
  let className = '';

  // Check for multiple fallacies
  const fallacyMarks = customLeaf.fallacyMarks || [];
  const fallacyCount = fallacyMarks.length;
  const hasFallacy = fallacyCount > 0 || customLeaf.fallacyColor;

  if (hasFallacy) {
    // Use the latest fallacy color (or fallback to single fallacyColor)
    const displayColor = fallacyCount > 0 
      ? fallacyMarks[fallacyCount - 1].color 
      : customLeaf.fallacyColor;
    style.backgroundColor = displayColor;
    style.padding = '2px 0';
    style.borderRadius = '2px';
  }

  if (customLeaf.bold) {
    className += 'font-bold ';
  }
  if (customLeaf.italic) {
    className += 'italic ';
  }
  if (customLeaf.underline) {
    className += 'underline ';
  }
  if (customLeaf.strikethrough) {
    className += 'line-through ';
  }

  // Get badge position and show tooltip
  const handleShowTooltip = () => {
    if (badgeRef.current) {
      setAnchorRect(badgeRef.current.getBoundingClientRect());
    }
    setShowTooltip(true);
  };
  
  const handleHideTooltip = () => {
    setShowTooltip(false);
    setAnchorRect(null);
  };

  // Show badge with tooltip if multiple fallacies
  // Use a wrapper div with position:relative to contain the tooltip without breaking Slate
  if (fallacyCount > 1) {
    return (
      <span {...attributes} style={style} className={className.trim() || undefined}>
        <span style={{ position: 'relative' }}>
          {children}
          <span
            ref={badgeRef}
            contentEditable={false}
            suppressContentEditableWarning
            onMouseEnter={handleShowTooltip}
            onMouseLeave={handleHideTooltip}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (showTooltip) {
                handleHideTooltip();
              } else {
                handleShowTooltip();
              }
            }}
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-12px',
              fontSize: '9px',
              fontWeight: 'bold',
              color: '#fff',
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: '6px',
              padding: '1px 4px',
              userSelect: 'none',
              cursor: 'pointer',
              lineHeight: '1',
              zIndex: 10,
            }}
          >
            +{fallacyCount - 1}
          </span>
          {showTooltip && (
            <FallacyTooltip marks={fallacyMarks} onClose={handleHideTooltip} anchorRect={anchorRect} />
          )}
        </span>
      </span>
    );
  }

  return (
    <span {...attributes} style={style} className={className.trim() || undefined}>
      {children}
    </span>
  );
};

const Element: React.FC<RenderElementProps> = ({ attributes, children, element }) => {
  const customElement = element as CustomElement;
  switch (customElement.type) {
    case 'heading-one':
      return <h1 {...attributes} className="text-2xl font-bold mb-2">{children}</h1>;
    case 'heading-two':
      return <h2 {...attributes} className="text-xl font-semibold mb-2">{children}</h2>;
    case 'block-quote':
      return (
        <blockquote {...attributes} className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
          {children}
        </blockquote>
      );
    default:
      return <p {...attributes} className="mb-2">{children}</p>;
  }
};

export const DebateEditor = forwardRef<DebateEditorHandle, DebateEditorProps>(
  (
    {
      initialValue = DEFAULT_INITIAL_VALUE,
      onChange,
      placeholder = 'Start typing or paste debate text here...',
      readOnly = false,
    },
    ref
  ) => {
    const editor = useMemo(() => withHistory(withReact(createEditor())), []);

    useImperativeHandle(ref, () => ({
      getEditor: () => editor,
    }));

    const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);
    const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, []);

    const handleChange = useCallback(
      (value: Descendant[]) => {
        onChange?.(value);
      },
      [onChange]
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (!event.ctrlKey && !event.metaKey) return;

        const markHotkeys: Record<string, MarkType> = {
          b: 'bold',
          i: 'italic',
          u: 'underline',
        };

        const mark = markHotkeys[event.key.toLowerCase()];
        if (mark) {
          event.preventDefault();
          toggleMark(editor, mark);
        }
      },
      [editor]
    );

    return (
      <div className="h-full flex flex-col border border-gray-200 rounded-lg overflow-hidden">
        <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
          {!readOnly && <EditorToolbar />}
          <Editable
            className="flex-1 p-4 focus:outline-none overflow-y-auto"
            renderLeaf={renderLeaf}
            renderElement={renderElement}
            placeholder={placeholder}
            readOnly={readOnly}
            onKeyDown={handleKeyDown}
            spellCheck
          />
        </Slate>
      </div>
    );
  }
);

DebateEditor.displayName = 'DebateEditor';
