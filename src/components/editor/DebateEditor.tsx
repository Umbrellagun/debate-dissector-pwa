import React, { useCallback, useMemo, useImperativeHandle, forwardRef, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact, RenderLeafProps, RenderElementProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { CustomEditor, CustomText, CustomElement, DEFAULT_INITIAL_VALUE, FallacyMark, RhetoricMark } from './types';
import { EditorToolbar } from './EditorToolbar';
import { toggleMark } from './utils';
import { MarkType } from './types';
import { FALLACIES } from '../../data/fallacies';
import { RHETORIC_TECHNIQUES } from '../../data/rhetoric';
import './types'; // Import type augmentation

// Helper to get fallacy name from ID
const getFallacyName = (fallacyId: string): string => {
  const fallacy = FALLACIES.find(f => f.id === fallacyId);
  return fallacy?.name || fallacyId;
};

// Helper to get rhetoric name from ID
const getRhetoricName = (rhetoricId: string): string => {
  const rhetoric = RHETORIC_TECHNIQUES.find(r => r.id === rhetoricId);
  return rhetoric?.name || rhetoricId;
};

// Tooltip component for showing multiple annotations (fallacies and rhetoric)
interface AnnotationTooltipProps {
  fallacyMarks: FallacyMark[];
  rhetoricMarks: RhetoricMark[];
  onClose: () => void;
  anchorRect: DOMRect | null;
  tooltipRef?: React.RefObject<HTMLDivElement | null>;
  onFallacyClick?: (fallacyId: string) => void;
  onRhetoricClick?: (rhetoricId: string) => void;
}

const AnnotationTooltip: React.FC<AnnotationTooltipProps> = ({ fallacyMarks, rhetoricMarks, onClose, anchorRect, tooltipRef, onFallacyClick, onRhetoricClick }) => {
  if (!anchorRect) return null;

  const totalItems = fallacyMarks.length + rhetoricMarks.length;
  const estimatedHeight = totalItems * 24 + (fallacyMarks.length > 0 && rhetoricMarks.length > 0 ? 80 : 50);
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
      ref={tooltipRef}
      contentEditable={false}
      onClick={(e) => e.stopPropagation()}
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
      {fallacyMarks.length > 0 && (
        <>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid #374151', paddingBottom: '4px', color: '#f87171' }}>
            Fallacies:
          </div>
          {fallacyMarks.map((mark, idx) => (
            <button
              key={mark.id}
              onClick={() => onFallacyClick?.(mark.fallacyId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: idx > 0 ? '4px' : 0,
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px',
                width: '100%',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
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
            </button>
          ))}
        </>
      )}
      {rhetoricMarks.length > 0 && (
        <>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', marginTop: fallacyMarks.length > 0 ? '8px' : 0, borderBottom: '1px solid #374151', paddingBottom: '4px', color: '#60a5fa' }}>
            Rhetoric:
          </div>
          {rhetoricMarks.map((mark, idx) => (
            <button
              key={mark.id}
              onClick={() => onRhetoricClick?.(mark.rhetoricId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: idx > 0 ? '4px' : 0,
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px',
                width: '100%',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: mark.color,
                  flexShrink: 0,
                }}
              />
              <span>{getRhetoricName(mark.rhetoricId)}</span>
            </button>
          ))}
        </>
      )}
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
  onSelectionChange?: () => void;
  onFallacyClick?: (fallacyId: string) => void;
  onRhetoricClick?: (rhetoricId: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

// Context for annotation click handlers
interface AnnotationClickContextType {
  onFallacyClick?: (fallacyId: string) => void;
  onRhetoricClick?: (rhetoricId: string) => void;
}
const AnnotationClickContext = React.createContext<AnnotationClickContextType>({});

const Leaf: React.FC<RenderLeafProps> = ({ attributes, children, leaf }) => {
  const customLeaf = leaf as CustomText;
  const [showTooltip, setShowTooltip] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { onFallacyClick, onRhetoricClick } = React.useContext(AnnotationClickContext);
  let style: React.CSSProperties = {};
  let className = '';
  
  // Handle click outside to close pinned tooltip
  useEffect(() => {
    if (!isPinned) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideBadge = badgeRef.current?.contains(target);
      const isInsideTooltip = tooltipRef.current?.contains(target);
      
      if (!isInsideBadge && !isInsideTooltip) {
        setShowTooltip(false);
        setIsPinned(false);
        setAnchorRect(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPinned]);

  // Check for annotations
  const fallacyMarks = customLeaf.fallacyMarks || [];
  const rhetoricMarks = customLeaf.rhetoricMarks || [];
  const fallacyCount = fallacyMarks.length;
  const rhetoricCount = rhetoricMarks.length;
  const totalAnnotations = fallacyCount + rhetoricCount;
  const hasFallacy = fallacyCount > 0 || customLeaf.fallacyColor;
  const hasRhetoric = rhetoricCount > 0;

  // Determine background color - use the most recently applied mark
  if (hasFallacy || hasRhetoric) {
    let displayColor: string | undefined;
    
    // Find the most recently applied mark across both types
    const lastFallacy = fallacyCount > 0 ? fallacyMarks[fallacyCount - 1] : null;
    const lastRhetoric = rhetoricCount > 0 ? rhetoricMarks[rhetoricCount - 1] : null;
    
    if (lastFallacy && lastRhetoric) {
      // Both exist - use whichever was applied last
      displayColor = (lastFallacy.appliedAt || 0) > (lastRhetoric.appliedAt || 0)
        ? lastFallacy.color
        : lastRhetoric.color;
    } else if (lastFallacy) {
      displayColor = lastFallacy.color;
    } else if (lastRhetoric) {
      displayColor = lastRhetoric.color;
    } else if (customLeaf.fallacyColor) {
      // Legacy fallback
      displayColor = customLeaf.fallacyColor;
    }
    
    if (displayColor) {
      style.backgroundColor = displayColor;
      style.padding = '2px 0';
      style.borderRadius = '2px';
    }
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
    // Don't hide if pinned
    if (isPinned) return;
    setShowTooltip(false);
    setAnchorRect(null);
  };
  
  const handleBadgeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPinned) {
      // Unpin and hide
      setIsPinned(false);
      setShowTooltip(false);
      setAnchorRect(null);
    } else {
      // Pin and show
      if (badgeRef.current) {
        setAnchorRect(badgeRef.current.getBoundingClientRect());
      }
      setShowTooltip(true);
      setIsPinned(true);
    }
  };

  // Show badge with tooltip if multiple annotations
  if (totalAnnotations > 1) {
    return (
      <span {...attributes} style={style} className={className.trim() || undefined}>
        <span style={{ position: 'relative' }}>
          {children}
          <span
            ref={badgeRef}
            contentEditable={false}
            suppressContentEditableWarning
            onClick={handleBadgeClick}
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-12px',
              fontSize: '9px',
              fontWeight: 'bold',
              color: '#fff',
              backgroundColor: hasRhetoric && !hasFallacy ? 'rgba(59,130,246,0.8)' : 'rgba(0,0,0,0.6)',
              borderRadius: '6px',
              padding: '1px 4px',
              userSelect: 'none',
              cursor: 'pointer',
              lineHeight: '1',
              zIndex: 10,
            }}
          >
            +{totalAnnotations - 1}
          </span>
          {showTooltip && (
            <AnnotationTooltip 
              fallacyMarks={fallacyMarks} 
              rhetoricMarks={rhetoricMarks} 
              onClose={handleHideTooltip} 
              anchorRect={anchorRect}
              tooltipRef={tooltipRef}
              onFallacyClick={onFallacyClick}
              onRhetoricClick={onRhetoricClick}
            />
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
      onSelectionChange,
      onFallacyClick,
      onRhetoricClick,
      placeholder = 'Start typing or paste debate text here...',
      readOnly = false,
    },
    ref
  ) => {
    const editor = useMemo(() => withHistory(withReact(createEditor())), []);
    
    const annotationClickContextValue = useMemo(() => ({
      onFallacyClick,
      onRhetoricClick,
    }), [onFallacyClick, onRhetoricClick]);

    useImperativeHandle(ref, () => ({
      getEditor: () => editor,
    }));

    const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);
    const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, []);

    const handleChange = useCallback(
      (value: Descendant[]) => {
        onChange?.(value);
        // Also trigger selection change callback when content changes
        onSelectionChange?.();
      },
      [onChange, onSelectionChange]
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

    const handleClick = useCallback(() => {
      // Trigger selection change on click to detect annotations at cursor
      onSelectionChange?.();
    }, [onSelectionChange]);

    return (
      <AnnotationClickContext.Provider value={annotationClickContextValue}>
        <div className="h-full flex flex-col border border-gray-200 rounded-lg overflow-hidden">
          <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
            {!readOnly && <EditorToolbar />}
            <Editable
              className="flex-1 p-3 sm:p-4 md:p-6 focus:outline-none overflow-y-auto text-base leading-relaxed"
              renderLeaf={renderLeaf}
              renderElement={renderElement}
              placeholder={placeholder}
              readOnly={readOnly}
              onKeyDown={handleKeyDown}
              onClick={handleClick}
              spellCheck
            />
          </Slate>
        </div>
      </AnnotationClickContext.Provider>
    );
  }
);

DebateEditor.displayName = 'DebateEditor';
