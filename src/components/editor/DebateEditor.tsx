import React, {
  useCallback,
  useMemo,
  useImperativeHandle,
  forwardRef,
  useState,
  useRef,
  useEffect,
} from 'react';
import { createEditor, Descendant, Editor, Transforms } from 'slate';
import {
  Slate,
  Editable,
  withReact,
  RenderLeafProps,
  RenderElementProps,
  ReactEditor,
} from 'slate-react';
import { withHistory } from 'slate-history';
import {
  CustomEditor,
  CustomText,
  CustomElement,
  DEFAULT_INITIAL_VALUE,
  FallacyMark,
  RhetoricMark,
  StructuralMark,
  ParagraphElement,
  BlockQuoteElement,
} from './types';
import { Speaker, Comment } from '../../models';
import { HiddenAnnotationIds } from './VisibilityControls';
import { EditorToolbar, PinnedAnnotation, PinnedSpeaker } from './EditorToolbar';
import { toggleMark } from './utils';
import { MarkType } from './types';
import { FALLACIES } from '../../data/fallacies';
import { RHETORIC_TECHNIQUES } from '../../data/rhetoric';
import { getStructuralMarkupById } from '../../data/structuralMarkup';
import './types'; // Import type augmentation

// Helper to get fallacy name from ID
const getFallacyName = (fallacyId: string): string => {
  const fallacy = FALLACIES.find(f => f.id === fallacyId);
  return fallacy?.name || fallacyId;
};

// Helper to get fallacy color from ID (dynamic lookup)
const getFallacyColor = (fallacyId: string): string | undefined => {
  const fallacy = FALLACIES.find(f => f.id === fallacyId);
  return fallacy?.color;
};

// Helper to get rhetoric name from ID
const getRhetoricName = (rhetoricId: string): string => {
  const rhetoric = RHETORIC_TECHNIQUES.find(r => r.id === rhetoricId);
  return rhetoric?.name || rhetoricId;
};

// Helper to get rhetoric color from ID (dynamic lookup)
const getRhetoricColor = (rhetoricId: string): string | undefined => {
  const rhetoric = RHETORIC_TECHNIQUES.find(r => r.id === rhetoricId);
  return rhetoric?.color;
};

// Helper to get structural markup name from ID
const getStructuralMarkupName = (markupId: string): string => {
  const markup = getStructuralMarkupById(markupId);
  return markup?.name || markupId;
};

// Helper to get structural markup color from ID (dynamic lookup)
const getStructuralMarkupColor = (markupId: string): string | undefined => {
  const markup = getStructuralMarkupById(markupId);
  return markup?.color;
};

// Helper to determine if a hex color is dark (for text contrast)
const isColorDark = (hex: string): boolean => {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  // W3C relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

// Tooltip component for showing multiple annotations (fallacies, rhetoric, and structural)
interface AnnotationTooltipProps {
  fallacyMarks: FallacyMark[];
  rhetoricMarks: RhetoricMark[];
  structuralMarks?: StructuralMark[];
  onClose: () => void;
  anchorRect: DOMRect | null;
  tooltipRef?: React.RefObject<HTMLDivElement | null>;
  onFallacyClick?: (fallacyId: string) => void;
  onRhetoricClick?: (rhetoricId: string) => void;
  onStructuralClick?: (markupId: string, metadata?: StructuralMark['metadata']) => void;
  selectLeafText?: (element: HTMLElement) => void;
  leafElement?: HTMLElement | null;
}

const AnnotationTooltip: React.FC<AnnotationTooltipProps> = ({
  fallacyMarks,
  rhetoricMarks,
  structuralMarks = [],
  anchorRect,
  tooltipRef,
  onFallacyClick,
  onRhetoricClick,
  onStructuralClick,
  selectLeafText,
  leafElement,
}) => {
  // Helper to check if a structural mark has a source citation
  const hasSourceCitation = (mark: StructuralMark) => {
    return (
      mark.metadata &&
      (mark.metadata.sourceUrl || mark.metadata.sourceAuthor || mark.metadata.sourcePublication)
    );
  };

  // Citable markup types that should show citation indicator
  const citableMarkupTypes = ['evidence', 'statistic', 'quote'];
  if (!anchorRect) return null;

  const totalItems = fallacyMarks.length + rhetoricMarks.length + structuralMarks.length;
  const estimatedHeight =
    totalItems * 24 + (fallacyMarks.length > 0 && rhetoricMarks.length > 0 ? 80 : 50);
  const viewportHeight = window.innerHeight;
  const spaceAbove = anchorRect.top;
  const spaceBelow = viewportHeight - anchorRect.bottom;

  const showBelow = spaceAbove < estimatedHeight + 10 && spaceBelow > estimatedHeight;

  // Position directly above or below the badge with minimal gap
  const top = showBelow ? anchorRect.bottom + 4 : anchorRect.top - estimatedHeight;

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
      onClick={e => e.stopPropagation()}
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
          <div
            style={{
              fontWeight: 'bold',
              marginBottom: '4px',
              borderBottom: '1px solid #374151',
              paddingBottom: '4px',
              color: '#f87171',
            }}
          >
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
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: getFallacyColor(mark.fallacyId) || mark.color,
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
          <div
            style={{
              fontWeight: 'bold',
              marginBottom: '4px',
              marginTop: fallacyMarks.length > 0 ? '8px' : 0,
              borderBottom: '1px solid #374151',
              paddingBottom: '4px',
              color: '#60a5fa',
            }}
          >
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
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: getRhetoricColor(mark.rhetoricId) || mark.color,
                  flexShrink: 0,
                }}
              />
              <span>{getRhetoricName(mark.rhetoricId)}</span>
            </button>
          ))}
        </>
      )}
      {structuralMarks.length > 0 && (
        <>
          <div
            style={{
              fontWeight: 'bold',
              marginBottom: '4px',
              marginTop: fallacyMarks.length > 0 || rhetoricMarks.length > 0 ? '8px' : 0,
              borderBottom: '1px solid #374151',
              paddingBottom: '4px',
              color: '#a78bfa',
            }}
          >
            Claims & Evidence:
          </div>
          {structuralMarks.map((mark, idx) => {
            const isCitable = citableMarkupTypes.includes(mark.markupId);
            const hasCitation = hasSourceCitation(mark);
            return (
              <button
                key={mark.id}
                onClick={() => {
                  // Select the text first so citation can be updated
                  if (leafElement && selectLeafText) {
                    selectLeafText(leafElement);
                  }
                  onStructuralClick?.(mark.markupId, mark.metadata);
                }}
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
                onMouseEnter={e =>
                  (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')
                }
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getStructuralMarkupColor(mark.markupId) || mark.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1 }}>{getStructuralMarkupName(mark.markupId)}</span>
                {isCitable && (
                  <span
                    title={hasCitation ? 'Has source citation' : 'Missing source citation'}
                    style={{
                      display: 'inline-flex',
                      marginLeft: '4px',
                    }}
                  >
                    {hasCitation ? (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.5"
                      >
                        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                        <path d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    ) : (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="2.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                      </svg>
                    )}
                  </span>
                )}
              </button>
            );
          })}
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
  onStructuralClick?: (markupId: string, metadata?: StructuralMark['metadata']) => void;
  placeholder?: string;
  readOnly?: boolean;
  selectedAnnotation?: { name: string; color: string } | null;
  hasTextSelection?: boolean;
  onApplyAnnotation?: () => void;
  pinnedAnnotations?: PinnedAnnotation[];
  onApplyPinnedAnnotation?: (annotation: PinnedAnnotation) => void;
  speakers?: Speaker[];
  hiddenSpeakerIds?: string[];
  pinnedSpeakers?: PinnedSpeaker[];
  onAssignPinnedSpeaker?: (speakerId: string) => void;
  comments?: Record<string, Comment>;
  hiddenAnnotationIds?: HiddenAnnotationIds;
}

// Context for annotation click handlers
interface AnnotationClickContextType {
  onFallacyClick?: (fallacyId: string) => void;
  onRhetoricClick?: (rhetoricId: string) => void;
  onStructuralClick?: (markupId: string, metadata?: StructuralMark['metadata']) => void;
  selectLeafText?: (element: HTMLElement) => void;
}
const AnnotationClickContext = React.createContext<AnnotationClickContextType>({});

// Context for speakers
const SpeakersContext = React.createContext<Speaker[]>([]);

// Context for hidden speaker IDs (for filtering)
const HiddenSpeakersContext = React.createContext<string[]>([]);

// Context for comments (to check resolved status in Leaf)
const CommentsContext = React.createContext<Record<string, Comment>>({});

// Context for hidden annotation IDs (visibility controls)
const HiddenAnnotationsContext = React.createContext<HiddenAnnotationIds>({
  fallacyIds: [],
  rhetoricIds: [],
  structuralIds: [],
});

const Leaf: React.FC<RenderLeafProps> = ({ attributes, children, leaf }) => {
  const customLeaf = leaf as CustomText;
  const [showTooltip, setShowTooltip] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { onFallacyClick, onRhetoricClick, onStructuralClick, selectLeafText } =
    React.useContext(AnnotationClickContext);
  const spanRef = useRef<HTMLSpanElement>(null);
  const style: React.CSSProperties = {};
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

  // Check for annotations — filter out hidden ones
  const hiddenIds = React.useContext(HiddenAnnotationsContext);
  const allFallacyMarks = customLeaf.fallacyMarks || [];
  const allRhetoricMarks = customLeaf.rhetoricMarks || [];
  const allStructuralMarks = customLeaf.structuralMarks || [];
  const commentMarks = customLeaf.commentMarks || [];
  const commentsRecord = React.useContext(CommentsContext);

  // Filter marks based on visibility settings
  const fallacyMarks = allFallacyMarks.filter(m => !hiddenIds.fallacyIds.includes(m.fallacyId));
  const rhetoricMarks = allRhetoricMarks.filter(m => !hiddenIds.rhetoricIds.includes(m.rhetoricId));
  const structuralMarks = allStructuralMarks.filter(
    m => !hiddenIds.structuralIds.includes(m.markupId)
  );

  const fallacyCount = fallacyMarks.length;
  const rhetoricCount = rhetoricMarks.length;
  const structuralCount = structuralMarks.length;
  // Only count unresolved comments for highlighting
  const unresolvedCommentMarks = commentMarks.filter(m => {
    const comment = commentsRecord[m.commentId];
    return comment && !comment.resolved;
  });
  const commentCount = unresolvedCommentMarks.length;
  const totalAnnotations = fallacyCount + rhetoricCount + structuralCount;
  // Check hasFallacy considering hidden IDs for legacy fallacyColor too
  const hasFallacy =
    fallacyCount > 0 ||
    (customLeaf.fallacyColor &&
      customLeaf.fallacyId &&
      !hiddenIds.fallacyIds.includes(customLeaf.fallacyId));
  const hasRhetoric = rhetoricCount > 0;
  const hasStructural = structuralCount > 0;
  const hasComments = commentCount > 0;

  // Determine background color - use dynamic lookup from fallacy/rhetoric ID
  if (hasFallacy || hasRhetoric) {
    let displayColor: string | undefined;

    // Find the most recently applied mark across both types
    const lastFallacy = fallacyCount > 0 ? fallacyMarks[fallacyCount - 1] : null;
    const lastRhetoric = rhetoricCount > 0 ? rhetoricMarks[rhetoricCount - 1] : null;

    if (lastFallacy && lastRhetoric) {
      // Both exist - use whichever was applied last
      displayColor =
        (lastFallacy.appliedAt || 0) > (lastRhetoric.appliedAt || 0)
          ? getFallacyColor(lastFallacy.fallacyId) || lastFallacy.color
          : getRhetoricColor(lastRhetoric.rhetoricId) || lastRhetoric.color;
    } else if (lastFallacy) {
      // Dynamic lookup by ID, fallback to stored color
      displayColor = getFallacyColor(lastFallacy.fallacyId) || lastFallacy.color;
    } else if (lastRhetoric) {
      // Dynamic lookup by ID, fallback to stored color
      displayColor = getRhetoricColor(lastRhetoric.rhetoricId) || lastRhetoric.color;
    } else if (customLeaf.fallacyId) {
      // Legacy fallback - try dynamic lookup first
      displayColor = getFallacyColor(customLeaf.fallacyId) || customLeaf.fallacyColor;
    }

    if (displayColor) {
      style.backgroundColor = displayColor;
      style.padding = '2px 0';
      style.borderRadius = '2px';
      // Auto-switch text to white if background is dark
      if (isColorDark(displayColor)) {
        style.color = '#ffffff';
      }
    }
  }

  // Handle structural marks - dotted underline to differentiate from fallacy/rhetoric
  const hasSourceCitation = structuralMarks.some(
    mark =>
      mark.metadata &&
      (mark.metadata.sourceUrl || mark.metadata.sourceAuthor || mark.metadata.sourcePublication)
  );
  const citableMarkupTypes = ['evidence', 'statistic', 'quote'];
  const isCitableMarkup = structuralMarks.some(mark => citableMarkupTypes.includes(mark.markupId));

  if (hasStructural) {
    const lastStructural = structuralMarks[structuralCount - 1];
    const structuralColor =
      getStructuralMarkupColor(lastStructural.markupId) || lastStructural.color;

    style.borderBottom = `2px dotted ${structuralColor}`;
    style.paddingBottom = '1px';
    // No background highlight - only underlines for structural marks
  }

  // Comment highlight - subtle amber background (only if no fallacy/rhetoric bg)
  if (hasComments && !hasFallacy && !hasRhetoric) {
    style.backgroundColor = 'rgba(251, 191, 36, 0.15)';
    style.borderBottom = style.borderBottom || '2px solid rgba(251, 191, 36, 0.4)';
    style.padding = style.padding || '2px 0';
    style.borderRadius = style.borderRadius || '2px';
  } else if (hasComments) {
    // If there are already annotation colors, add a top amber border as indicator
    style.boxShadow = 'inset 0 2px 0 rgba(251, 191, 36, 0.5)';
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
  const _handleShowTooltip = () => {
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
              backgroundColor:
                hasRhetoric && !hasFallacy ? 'rgba(59,130,246,0.8)' : 'rgba(0,0,0,0.6)',
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
              structuralMarks={structuralMarks}
              onClose={handleHideTooltip}
              anchorRect={anchorRect}
              tooltipRef={tooltipRef}
              onFallacyClick={onFallacyClick}
              onRhetoricClick={onRhetoricClick}
              onStructuralClick={onStructuralClick}
              selectLeafText={selectLeafText}
              leafElement={spanRef.current}
            />
          )}
        </span>
      </span>
    );
  }

  // Handle click on annotated text - select first annotation in sidebar
  const handleAnnotationClick = (_e: React.MouseEvent) => {
    // Only trigger if it's a simple click (no text selection)
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;

    // Select this leaf's text so it can be edited
    if (spanRef.current && selectLeafText) {
      selectLeafText(spanRef.current);
    }

    // Find the first annotation and trigger its click handler
    if (fallacyMarks[0] && onFallacyClick) {
      onFallacyClick(fallacyMarks[0].fallacyId);
    } else if (rhetoricMarks[0] && onRhetoricClick) {
      onRhetoricClick(rhetoricMarks[0].rhetoricId);
    } else if (structuralMarks[0] && onStructuralClick) {
      // Pass metadata so citation form can be pre-populated
      onStructuralClick(structuralMarks[0].markupId, structuralMarks[0].metadata);
    }
  };

  // Any annotated text is clickable
  if (totalAnnotations > 0) {
    // Show source indicator for citable structural markup
    const showSourceIndicator = hasStructural && isCitableMarkup;

    return (
      <span
        {...attributes}
        ref={spanRef}
        style={{ ...style, cursor: 'pointer', position: 'relative' }}
        className={className.trim() || undefined}
        onClick={handleAnnotationClick}
      >
        {children}
        {showSourceIndicator && (
          <span
            contentEditable={false}
            suppressContentEditableWarning
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              marginLeft: '2px',
              verticalAlign: 'super',
              fontSize: '10px',
              userSelect: 'none',
            }}
            title={hasSourceCitation ? 'Has source citation' : 'Missing source citation'}
          >
            {hasSourceCitation ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
              >
                <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                <path d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            ) : (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            )}
          </span>
        )}
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
  const speakers = React.useContext(SpeakersContext);
  const hiddenSpeakerIds = React.useContext(HiddenSpeakersContext);

  // Get speaker info if element has a speakerId
  const speakerId = (customElement as ParagraphElement | BlockQuoteElement).speakerId;
  const speaker = speakerId ? speakers.find(s => s.id === speakerId) : null;
  const isHidden = speakerId ? hiddenSpeakerIds.includes(speakerId) : false;

  // Hidden style for filtered paragraphs
  const hiddenStyle: React.CSSProperties = isHidden
    ? {
        opacity: 0.3,
        filter: 'grayscale(100%)',
        pointerEvents: 'none' as const,
      }
    : {};

  switch (customElement.type) {
    case 'heading-one':
      return (
        <h1 {...attributes} className="text-2xl font-bold mb-2">
          {children}
        </h1>
      );
    case 'heading-two':
      return (
        <h2 {...attributes} className="text-xl font-semibold mb-2">
          {children}
        </h2>
      );
    case 'block-quote':
      if (speaker) {
        return (
          <div {...attributes} className="relative mb-2" style={hiddenStyle}>
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
              style={{ backgroundColor: speaker.color }}
              title={speaker.name}
            />
            <blockquote className="border-l-4 border-gray-300 pl-4 ml-3 italic text-gray-600">
              {children}
            </blockquote>
          </div>
        );
      }
      return (
        <blockquote
          {...attributes}
          className="border-l-4 border-gray-300 pl-4 italic text-gray-600"
        >
          {children}
        </blockquote>
      );
    default:
      if (speaker) {
        return (
          <div {...attributes} className="relative mb-2" style={hiddenStyle}>
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
              style={{ backgroundColor: speaker.color }}
              title={speaker.name}
            />
            <p className="pl-3">{children}</p>
          </div>
        );
      }
      return (
        <p {...attributes} className="mb-2">
          {children}
        </p>
      );
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
      onStructuralClick,
      placeholder = 'Start typing or paste debate text here...',
      readOnly = false,
      selectedAnnotation,
      hasTextSelection,
      onApplyAnnotation,
      pinnedAnnotations,
      onApplyPinnedAnnotation,
      speakers = [],
      hiddenSpeakerIds = [],
      pinnedSpeakers = [],
      onAssignPinnedSpeaker,
      comments = {},
      hiddenAnnotationIds = { fallacyIds: [], rhetoricIds: [], structuralIds: [] },
    },
    ref
  ) => {
    const editor = useMemo(() => withHistory(withReact(createEditor())), []);

    // Function to select the text of a leaf element in the editor
    const selectLeafText = useCallback(
      (element: HTMLElement) => {
        const slateNode = ReactEditor.toSlateNode(editor, element);
        const path = ReactEditor.findPath(editor, slateNode);
        const range = Editor.range(editor, path);
        Transforms.select(editor, range);
        ReactEditor.focus(editor);
      },
      [editor]
    );

    const annotationClickContextValue = useMemo(
      () => ({
        onFallacyClick,
        onRhetoricClick,
        onStructuralClick,
        selectLeafText,
      }),
      [onFallacyClick, onRhetoricClick, onStructuralClick, selectLeafText]
    );

    useImperativeHandle(ref, () => ({
      getEditor: () => editor,
    }));

    const renderLeaf = useCallback(
      (props: RenderLeafProps) => <Leaf {...props} />,
      [onFallacyClick, onRhetoricClick, onStructuralClick]
    );
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
        <SpeakersContext.Provider value={speakers}>
          <HiddenSpeakersContext.Provider value={hiddenSpeakerIds}>
            <CommentsContext.Provider value={comments}>
              <HiddenAnnotationsContext.Provider value={hiddenAnnotationIds}>
                <div className="h-full flex flex-col border border-gray-200 rounded-lg overflow-hidden">
                  <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
                    {!readOnly && (
                      <EditorToolbar
                        selectedAnnotation={selectedAnnotation}
                        hasTextSelection={hasTextSelection}
                        onApplyAnnotation={onApplyAnnotation}
                        pinnedAnnotations={pinnedAnnotations}
                        onApplyPinnedAnnotation={onApplyPinnedAnnotation}
                        pinnedSpeakers={pinnedSpeakers}
                        onAssignPinnedSpeaker={onAssignPinnedSpeaker}
                      />
                    )}
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
              </HiddenAnnotationsContext.Provider>
            </CommentsContext.Provider>
          </HiddenSpeakersContext.Provider>
        </SpeakersContext.Provider>
      </AnnotationClickContext.Provider>
    );
  }
);

DebateEditor.displayName = 'DebateEditor';
