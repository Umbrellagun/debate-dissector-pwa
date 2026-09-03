import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
  ReactZoomPanPinchContentRef,
} from 'react-zoom-pan-pinch';
import { Descendant } from 'slate';
import { CustomText, FallacyMark, RhetoricMark, StructuralMark } from './types';
import {
  TagInfo,
  getFallacyInfo,
  getRhetoricInfo,
  getStructuralInfo,
  isColorDark,
} from './markTagUtils';
import { Speaker, ArgumentLink, LinkType } from '../../models/document';
import {
  wouldCreateCycle,
  migrateLinks,
  LINK_TYPE_COLORS,
  LINK_TYPE_LABELS,
} from '../../utils/argumentGraph';

// Zoom controls overlay for map view
const MapZoomControls: React.FC = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div
      id="map-zoom-controls"
      data-role="zoom-controls"
      data-no-export="true"
      className="absolute bottom-3 right-3 z-30 flex items-center gap-1 bg-white rounded-lg shadow-md border border-gray-200 p-1"
    >
      <button
        type="button"
        id="map-zoom-in"
        onClick={() => zoomIn()}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 transition-colors"
        title="Zoom in"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <button
        type="button"
        id="map-zoom-out"
        onClick={() => zoomOut()}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 transition-colors"
        title="Zoom out"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>
      <div className="w-px h-5 bg-gray-200" />
      <button
        type="button"
        id="map-zoom-reset"
        onClick={() => resetTransform()}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 transition-colors text-xs font-medium"
        title="Reset view"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
      </button>
    </div>
  );
};

// A single block of marked-up text extracted from the document
export interface MarkupBlock {
  id: string;
  primaryMarkId: string; // First mark's id — used for linking
  text: string;
  // Which marks are on this block
  fallacyMarks: FallacyMark[];
  rhetoricMarks: RhetoricMark[];
  structuralMarks: StructuralMark[];
  // Context
  speakerId?: string;
  paragraphIndex: number;
}

export interface ArgumentMapViewProps {
  content: Descendant[];
  speakers?: Speaker[];
  customColors?: Record<string, string>;
  argumentLinks?: ArgumentLink[];
  thesisMarkIds?: string[];
  onFallacyClick?: (fallacyId: string) => void;
  onRhetoricClick?: (rhetoricId: string) => void;
  onStructuralClick?: (markupId: string) => void;
  onCreateLink?: (sourceMarkId: string, targetMarkId: string, linkType: LinkType) => void;
  onDeleteLink?: (linkId: string) => void;
  onToggleThesis?: (markId: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

// Get the primary mark ID for a block (first mark's id)
function getPrimaryMarkId(
  fallacyMarks: FallacyMark[],
  rhetoricMarks: RhetoricMark[],
  structuralMarks: StructuralMark[]
): string {
  return fallacyMarks[0]?.id || rhetoricMarks[0]?.id || structuralMarks[0]?.id || '';
}

// Get all mark IDs for a block
function getAllMarkIds(block: MarkupBlock): string[] {
  return [
    ...block.fallacyMarks.map(m => m.id),
    ...block.rhetoricMarks.map(m => m.id),
    ...block.structuralMarks.map(m => m.id),
  ];
}

// Extract all markup blocks from document content in document order
export function extractMarkupBlocks(content: Descendant[]): MarkupBlock[] {
  const blocks: MarkupBlock[] = [];
  let blockCounter = 0;

  for (let pIdx = 0; pIdx < content.length; pIdx++) {
    const element = content[pIdx] as { type?: string; children?: Descendant[]; speakerId?: string };
    if (!element.children) continue;
    const speakerId = element.speakerId;

    // Walk through text nodes in this paragraph and merge adjacent marked text
    let currentBlock: MarkupBlock | null = null;

    for (const child of element.children) {
      const textNode = child as CustomText;
      if (!textNode.text) continue;

      const hasFallacy = (textNode.fallacyMarks?.length || 0) > 0;
      const hasRhetoric = (textNode.rhetoricMarks?.length || 0) > 0;
      const hasStructural = (textNode.structuralMarks?.length || 0) > 0;
      const hasAnyMark = hasFallacy || hasRhetoric || hasStructural;

      if (!hasAnyMark) {
        // Unmarked text — flush current block if any
        if (currentBlock) {
          blocks.push(currentBlock);
          currentBlock = null;
        }
        continue;
      }

      // Check if this text node has the same mark signature as the current block
      const markKey = getMarkSignature(textNode);
      const currentKey = currentBlock ? getBlockSignature(currentBlock) : null;

      if (currentBlock && markKey === currentKey) {
        // Same marks — extend the current block text and merge in any
        // additional mark instance IDs so link resolution can still find them
        currentBlock.text += textNode.text;
        const existingIds = new Set(getAllMarkIds(currentBlock));
        for (const m of textNode.fallacyMarks || []) {
          if (!existingIds.has(m.id)) currentBlock.fallacyMarks.push(m);
        }
        for (const m of textNode.rhetoricMarks || []) {
          if (!existingIds.has(m.id)) currentBlock.rhetoricMarks.push(m);
        }
        for (const m of textNode.structuralMarks || []) {
          if (!existingIds.has(m.id)) currentBlock.structuralMarks.push(m);
        }
      } else {
        // Different marks — flush and start new
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        const fm = textNode.fallacyMarks || [];
        const rm = textNode.rhetoricMarks || [];
        const sm = textNode.structuralMarks || [];
        currentBlock = {
          id: `block_${blockCounter++}`,
          primaryMarkId: getPrimaryMarkId(fm, rm, sm),
          text: textNode.text,
          fallacyMarks: fm,
          rhetoricMarks: rm,
          structuralMarks: sm,
          speakerId,
          paragraphIndex: pIdx,
        };
      }
    }

    // Flush remaining block for this paragraph
    if (currentBlock) {
      blocks.push(currentBlock);
      currentBlock = null;
    }
  }

  return blocks;
}

// Create a signature string for a text node's marks (for merging adjacent nodes)
function getMarkSignature(node: CustomText): string {
  const parts: string[] = [];
  if (node.fallacyMarks) {
    parts.push(
      'f:' +
        node.fallacyMarks
          .map(m => m.fallacyId)
          .sort()
          .join(',')
    );
  }
  if (node.rhetoricMarks) {
    parts.push(
      'r:' +
        node.rhetoricMarks
          .map(m => m.rhetoricId)
          .sort()
          .join(',')
    );
  }
  if (node.structuralMarks) {
    parts.push(
      's:' +
        node.structuralMarks
          .map(m => m.markupId)
          .sort()
          .join(',')
    );
  }
  return parts.join('|');
}

function getBlockSignature(block: MarkupBlock): string {
  const parts: string[] = [];
  if (block.fallacyMarks.length > 0) {
    parts.push(
      'f:' +
        block.fallacyMarks
          .map(m => m.fallacyId)
          .sort()
          .join(',')
    );
  }
  if (block.rhetoricMarks.length > 0) {
    parts.push(
      'r:' +
        block.rhetoricMarks
          .map(m => m.rhetoricId)
          .sort()
          .join(',')
    );
  }
  if (block.structuralMarks.length > 0) {
    parts.push(
      's:' +
        block.structuralMarks
          .map(m => m.markupId)
          .sort()
          .join(',')
    );
  }
  return parts.join('|');
}

// --- Tag badge for a single mark ---
const MarkTag: React.FC<{ tag: TagInfo; onClick?: () => void }> = ({ tag, onClick }) => (
  <button
    type="button"
    id={`map-mark-tag-${tag.type}-${tag.id}`}
    data-role="mark-tag"
    onClick={onClick}
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer hover:opacity-80 transition-opacity"
    style={{
      backgroundColor: tag.color,
      color: isColorDark(tag.color) ? '#fff' : '#1f2937',
    }}
  >
    <span className="opacity-70">{tag.category}:</span> {tag.label}
  </button>
);

// --- Single markup block card ---
const BlockCard = React.forwardRef<
  HTMLDivElement,
  {
    block: MarkupBlock;
    speaker?: Speaker;
    customColors?: Record<string, string>;
    onFallacyClick?: (fallacyId: string) => void;
    onRhetoricClick?: (rhetoricId: string) => void;
    onStructuralClick?: (markupId: string) => void;
    isLinkSource?: boolean;
    isLinkTarget?: boolean;
    isLinking?: boolean;
    onBlockClick?: () => void;
    linkedTo?: {
      label: string;
      direction: 'incoming' | 'outgoing';
      linkType: LinkType;
      linkId: string;
      onDelete: () => void;
    }[];
    isThesis?: boolean;
    onToggleThesis?: () => void;
  }
>(
  (
    {
      block,
      speaker,
      customColors,
      onFallacyClick,
      onRhetoricClick,
      onStructuralClick,
      isLinkSource,
      isLinkTarget,
      isLinking,
      onBlockClick,
      linkedTo,
      isThesis,
      onToggleThesis,
    },
    ref
  ) => {
    // Collect all tags for this block
    const tags: TagInfo[] = [];

    for (const mark of block.fallacyMarks) {
      tags.push(getFallacyInfo(mark, customColors));
    }
    for (const mark of block.rhetoricMarks) {
      tags.push(getRhetoricInfo(mark, customColors));
    }
    for (const mark of block.structuralMarks) {
      tags.push(getStructuralInfo(mark, customColors));
    }

    // Use speaker color for the left border, fall back to primary tag color
    const borderColor = speaker?.color || tags[0]?.color || '#6B7280';

    const ringClass = isLinkSource
      ? 'ring-2 ring-violet-500 ring-offset-2'
      : isLinkTarget
        ? 'ring-2 ring-emerald-400 ring-offset-2'
        : '';
    const cursorClass = isLinking ? 'cursor-crosshair' : '';

    return (
      <div
        ref={ref}
        id={`map-block-${block.primaryMarkId.slice(0, 8)}`}
        data-role="map-block"
        data-block-id={block.primaryMarkId}
        className={`relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md ${ringClass} ${cursorClass}`}
        style={{ borderLeftWidth: '4px', borderLeftColor: borderColor }}
        onClick={isLinking ? onBlockClick : undefined}
      >
        {/* Tags row */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 pt-3 pb-1">
          {isThesis && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
              ★ Thesis
            </span>
          )}
          {tags.map((tag, i) => (
            <MarkTag
              key={i}
              tag={tag}
              onClick={
                isLinking
                  ? undefined
                  : () => {
                      if (tag.type === 'fallacy') onFallacyClick?.(tag.id);
                      else if (tag.type === 'rhetoric') onRhetoricClick?.(tag.id);
                      else if (tag.type === 'structural') onStructuralClick?.(tag.id);
                    }
              }
            />
          ))}
          {speaker && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: `${speaker.color}18`, color: speaker.color }}
            >
              {speaker.name}
            </span>
          )}
          {onToggleThesis && !isLinking && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onToggleThesis();
              }}
              className={`ml-auto text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                isThesis
                  ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                  : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
              }`}
              title={isThesis ? 'Remove thesis designation' : 'Mark as thesis'}
            >
              {isThesis ? '★' : '☆'}
            </button>
          )}
        </div>

        {/* Quoted text */}
        <div className="px-4 pt-1 pb-3">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{block.text}</p>
        </div>

        {/* Link badges + link button row */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-2">
          {linkedTo &&
            linkedTo.map((link, i) => (
              <span
                key={i}
                id={`map-link-badge-${block.primaryMarkId.slice(0, 8)}-${i}`}
                data-role="link-badge"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 group"
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: LINK_TYPE_COLORS[link.linkType] }}
                />
                {link.direction === 'outgoing' ? '→' : '←'} {LINK_TYPE_LABELS[link.linkType]}:{' '}
                {link.label}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    link.onDelete();
                  }}
                  className="ml-0.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove link"
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      </div>
    );
  }
);
BlockCard.displayName = 'BlockCard';

// --- Link type selection popover ---
const LINK_TYPE_OPTIONS: {
  type: LinkType;
  label: string;
  description: string;
  bg: string;
  text: string;
  hoverBg: string;
}[] = [
  {
    type: 'supports',
    label: 'Supports',
    description: 'This block supports/agrees with the target',
    bg: 'bg-green-50',
    text: 'text-green-700',
    hoverBg: 'hover:bg-green-100',
  },
  {
    type: 'rebuts',
    label: 'Rebuts',
    description: 'This block argues against the target',
    bg: 'bg-red-50',
    text: 'text-red-700',
    hoverBg: 'hover:bg-red-100',
  },
];

const LinkTypePopover: React.FC<{
  anchorRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (linkType: LinkType) => void;
  onCancel: () => void;
}> = ({ anchorRef, onSelect, onCancel }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(8, rect.left + rect.width / 2 - 120),
      });
    }
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onCancel]);

  if (!position) return null;

  return (
    <div
      ref={popoverRef}
      id="map-link-popover"
      data-role="link-type-popover"
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-60 animate-in fade-in slide-in-from-top-1"
      style={{ top: position.top, left: position.left }}
    >
      <p className="text-xs font-medium text-gray-600 mb-2">How does this relate?</p>
      <div className="space-y-1.5">
        {LINK_TYPE_OPTIONS.map(opt => (
          <button
            key={opt.type}
            id={`map-link-option-${opt.type}`}
            data-role="link-type-option"
            type="button"
            onClick={() => onSelect(opt.type)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors ${opt.bg} ${opt.text} ${opt.hoverBg}`}
          >
            <span>{opt.label}</span>
            <span className="text-[10px] font-normal opacity-70 ml-auto">{opt.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Compute an SVG arrow path curving to the left in the timeline gutter
function computeArrowPath(sourceY: number, targetY: number, linkIndex: number): string {
  const x = 14; // timeline rail x position
  const distance = Math.abs(targetY - sourceY);
  // Curve further left for longer connections, stagger by index to avoid overlap
  const curveX = Math.max(-20, x - 28 - linkIndex * 10 - Math.min(distance * 0.04, 30));
  return `M ${x} ${sourceY} C ${curveX} ${sourceY}, ${curveX} ${targetY}, ${x} ${targetY}`;
}

const EMPTY_LINKS: import('../../models/document').ArgumentLink[] = [];
const EMPTY_SPEAKERS: Speaker[] = [];
const EMPTY_THESIS_IDS: string[] = [];

// --- Main component ---
export const ArgumentMapView: React.FC<ArgumentMapViewProps> = ({
  content,
  speakers = EMPTY_SPEAKERS,
  customColors,
  argumentLinks = EMPTY_LINKS,
  thesisMarkIds = EMPTY_THESIS_IDS,
  onFallacyClick,
  onRhetoricClick,
  onStructuralClick,
  onCreateLink,
  onDeleteLink,
  onToggleThesis,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const blocks = useMemo(() => extractMarkupBlocks(content), [content]);
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null); // primaryMarkId of source
  // Pending link awaiting type selection via popover
  const [pendingLink, setPendingLink] = useState<{
    sourceMarkId: string;
    targetMarkId: string;
  } | null>(null);
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const blocksContainerRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef<ReactZoomPanPinchContentRef | null>(null);
  const [arrowPaths, setArrowPaths] = useState<
    { path: string; id: string; srcY: number; tgtY: number; color: string }[]
  >([]);
  const [svgHeight, setSvgHeight] = useState(0);

  // Center the pan/zoom canvas on the topmost cards after layout
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const ref = transformRef.current;
      if (!ref) return;
      const wrapper = ref.instance.wrapperComponent;
      const content = ref.instance.contentComponent;
      if (!wrapper || !content) return;
      const x = (wrapper.offsetWidth - content.offsetWidth) / 2;
      ref.setTransform(x, 16, 1);
    });
    return () => cancelAnimationFrame(frame);
  }, [blocks]);

  // Migrate links that may be missing linkType (backward compat)
  const migratedLinks = useMemo(() => migrateLinks(argumentLinks), [argumentLinks]);

  // Thesis lookup set
  const thesisSet = useMemo(() => new Set(thesisMarkIds), [thesisMarkIds]);

  // Build a speaker lookup
  const speakerMap = useMemo(() => {
    const map: Record<string, Speaker> = {};
    for (const s of speakers) {
      map[s.id] = s;
    }
    return map;
  }, [speakers]);

  // Build a map of primaryMarkId → block for quick lookup
  const blockByMarkId = useMemo(() => {
    const map: Record<string, MarkupBlock> = {};
    for (const b of blocks) {
      // Map all mark IDs to this block so links can resolve
      for (const mid of getAllMarkIds(b)) {
        map[mid] = b;
      }
    }
    return map;
  }, [blocks]);

  // Resolve links to block pairs
  const resolvedLinks = useMemo(() => {
    return migratedLinks
      .map(link => ({
        ...link,
        sourceBlock: blockByMarkId[link.sourceMarkId],
        targetBlock: blockByMarkId[link.targetMarkId],
      }))
      .filter(l => l.sourceBlock && l.targetBlock);
  }, [migratedLinks, blockByMarkId]);

  // Build linked-to info for each block
  const linkedToMap = useMemo(() => {
    const map: Record<
      string,
      {
        label: string;
        direction: 'incoming' | 'outgoing';
        linkType: LinkType;
        linkId: string;
        onDelete: () => void;
      }[]
    > = {};
    for (const link of resolvedLinks) {
      const srcId = link.sourceBlock!.primaryMarkId;
      const tgtId = link.targetBlock!.primaryMarkId;
      const lt = link.linkType || ('supports' as LinkType);
      // Outgoing: this block responds to target
      if (!map[srcId]) map[srcId] = [];
      const targetText =
        link.targetBlock!.text.slice(0, 30) + (link.targetBlock!.text.length > 30 ? '…' : '');
      map[srcId].push({
        label: targetText,
        direction: 'outgoing',
        linkType: lt,
        linkId: link.id,
        onDelete: () => onDeleteLink?.(link.id),
      });
      // Incoming: this block is responded to by source
      if (!map[tgtId]) map[tgtId] = [];
      const sourceText =
        link.sourceBlock!.text.slice(0, 30) + (link.sourceBlock!.text.length > 30 ? '…' : '');
      map[tgtId].push({
        label: sourceText,
        direction: 'incoming',
        linkType: lt,
        linkId: link.id,
        onDelete: () => onDeleteLink?.(link.id),
      });
    }
    return map;
  }, [resolvedLinks, onDeleteLink]);

  // Compute arrow positions after layout
  const updateArrows = useCallback(() => {
    if (!blocksContainerRef.current) return;
    const containerRect = blocksContainerRef.current.getBoundingClientRect();
    // getBoundingClientRect returns viewport-pixel values (scaled by zoom),
    // but the SVG lives inside the TransformComponent (unscaled content space).
    // Divide by the current scale to convert viewport → content coordinates.
    const scale = transformRef.current?.state?.scale ?? 1;
    const paths: { path: string; id: string; srcY: number; tgtY: number; color: string }[] = [];
    let maxBottom = 0;

    for (let idx = 0; idx < resolvedLinks.length; idx++) {
      const link = resolvedLinks[idx];
      const srcEl = blockRefs.current[link.sourceBlock!.primaryMarkId];
      const tgtEl = blockRefs.current[link.targetBlock!.primaryMarkId];
      if (!srcEl || !tgtEl) continue;

      const srcRect = srcEl.getBoundingClientRect();
      const tgtRect = tgtEl.getBoundingClientRect();

      // Positions relative to the blocks container, converted to content space
      const srcY = (srcRect.top - containerRect.top + srcRect.height / 2) / scale;
      const tgtY = (tgtRect.top - containerRect.top + tgtRect.height / 2) / scale;

      const lt = link.linkType || 'supports';
      const color = LINK_TYPE_COLORS[lt];

      paths.push({
        path: computeArrowPath(srcY, tgtY, idx),
        id: link.id,
        srcY,
        tgtY,
        color,
      });
      maxBottom = Math.max(maxBottom, srcY, tgtY);
    }

    setSvgHeight(maxBottom + 50);
    setArrowPaths(paths);
  }, [resolvedLinks]);

  useEffect(() => {
    // Delay to ensure DOM has laid out
    const frame = requestAnimationFrame(() => updateArrows());
    return () => cancelAnimationFrame(frame);
  }, [resolvedLinks.length, blocks.length, updateArrows]);

  const handleBlockRef = useCallback(
    (markId: string) => (el: HTMLDivElement | null) => {
      blockRefs.current[markId] = el;
    },
    []
  );

  const handleBlockClickForLinking = useCallback(
    (block: MarkupBlock) => {
      if (!linkingFrom) return;
      if (block.primaryMarkId === linkingFrom) {
        // Clicked same block — cancel
        setLinkingFrom(null);
        return;
      }
      // Cycle detection
      if (wouldCreateCycle(linkingFrom, block.primaryMarkId, migratedLinks)) {
        // TODO: show toast in the future
        setLinkingFrom(null);
        return;
      }
      // Show link type popover instead of immediately creating
      setPendingLink({ sourceMarkId: linkingFrom, targetMarkId: block.primaryMarkId });
      setLinkingFrom(null);
    },
    [linkingFrom, migratedLinks]
  );

  const handleLinkTypeSelected = useCallback(
    (linkType: LinkType) => {
      if (!pendingLink) return;
      onCreateLink?.(pendingLink.sourceMarkId, pendingLink.targetMarkId, linkType);
      setPendingLink(null);
    },
    [pendingLink, onCreateLink]
  );

  const handleLinkTypeCancel = useCallback(() => {
    setPendingLink(null);
  }, []);

  const startLinking = useCallback((block: MarkupBlock) => {
    setLinkingFrom(block.primaryMarkId);
  }, []);

  const cancelLinking = useCallback(() => {
    setLinkingFrom(null);
  }, []);

  // Keyboard shortcuts for undo/redo (Ctrl+Z / Ctrl+Shift+Z)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo?.();
        } else {
          onUndo?.();
        }
      }
      if ((e.ctrlKey || e.metaKey) && key === 'y') {
        e.preventDefault();
        onRedo?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onUndo, onRedo]);

  // Summary counts
  const summary = useMemo(() => {
    let fallacyCount = 0;
    let rhetoricCount = 0;
    let structuralCount = 0;
    const uniqueFallacies = new Set<string>();
    const uniqueRhetoric = new Set<string>();
    const uniqueStructural = new Set<string>();

    for (const b of blocks) {
      if (b.fallacyMarks.length > 0) {
        fallacyCount++;
        b.fallacyMarks.forEach(m => uniqueFallacies.add(m.fallacyId));
      }
      if (b.rhetoricMarks.length > 0) {
        rhetoricCount++;
        b.rhetoricMarks.forEach(m => uniqueRhetoric.add(m.rhetoricId));
      }
      if (b.structuralMarks.length > 0) {
        structuralCount++;
        b.structuralMarks.forEach(m => uniqueStructural.add(m.markupId));
      }
    }
    return {
      total: blocks.length,
      fallacyCount,
      rhetoricCount,
      structuralCount,
      uniqueFallacies: uniqueFallacies.size,
      uniqueRhetoric: uniqueRhetoric.size,
      uniqueStructural: uniqueStructural.size,
    };
  }, [blocks]);

  if (blocks.length === 0) {
    return (
      <div
        id="map-view-empty"
        data-role="empty-state"
        className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50"
      >
        <svg
          className="w-16 h-16 text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-500 mb-1">No markups found</h3>
        <p className="text-sm text-gray-400 max-w-sm">
          Switch back to the editor and annotate text with fallacies, rhetoric techniques, or
          structural markup to see them displayed here.
        </p>
      </div>
    );
  }

  return (
    <div
      id="map-view-root"
      data-role="map-view"
      className="flex-1 flex flex-col min-h-0 bg-gray-50 overflow-hidden"
    >
      {/* Summary bar */}
      <div
        id="map-summary-bar"
        data-role="summary-bar"
        data-no-export="true"
        className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 shrink-0"
      >
        <span className="text-xs font-medium text-gray-500">
          {summary.total} marked passage{summary.total !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          {summary.fallacyCount > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-700">
              {summary.uniqueFallacies} fallac{summary.uniqueFallacies !== 1 ? 'ies' : 'y'}
            </span>
          )}
          {summary.rhetoricCount > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {summary.uniqueRhetoric} rhetoric
            </span>
          )}
          {summary.structuralCount > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              {summary.uniqueStructural} structural
            </span>
          )}
        </div>

        {/* Linking controls */}
        {linkingFrom && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-violet-600 font-medium animate-pulse">
              Click a target block…
            </span>
            <button
              type="button"
              onClick={cancelLinking}
              className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Undo/Redo controls */}
        {(onUndo || onRedo) && !linkingFrom && (
          <div id="map-undo-redo" data-role="undo-redo" className="ml-auto flex items-center gap-1">
            <button
              type="button"
              id="map-undo-btn"
              onClick={onUndo}
              disabled={!canUndo}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 6l-4 4 4 4" />
              </svg>
            </button>
            <button
              type="button"
              id="map-redo-btn"
              onClick={onRedo}
              disabled={!canRedo}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
              title="Redo (Ctrl+Shift+Z)"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 6l4 4-4 4" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Blocks canvas with timeline — pannable/zoomable */}
      <div id="map-content-area" data-role="content-area" className="flex-1 min-h-0 relative">
        <TransformWrapper
          initialScale={1}
          minScale={0.15}
          maxScale={2}
          ref={transformRef}
          limitToBounds={false}
          smooth={false}
          panning={{ velocityDisabled: true }}
          wheel={{ step: 0.2 }}
          onTransform={() => updateArrows()}
        >
          <MapZoomControls />
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ padding: '2rem' }}
          >
            <div className="max-w-2xl mx-auto" data-map-export-root="true">
              {/* Timeline rail + blocks */}
              <div ref={blocksContainerRef} className="relative pl-8">
                {/* Vertical timeline line */}
                <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-300" />

                {/* SVG arrow overlay — in the left gutter */}
                {arrowPaths.length > 0 && (
                  <svg
                    className="absolute top-0 left-0 pointer-events-none z-20"
                    style={{ height: svgHeight, width: 32, overflow: 'visible' }}
                  >
                    <defs>
                      {arrowPaths.map(({ id, color }) => (
                        <marker
                          key={`marker-${id}`}
                          id={`arrowhead-${id}`}
                          markerWidth="10"
                          markerHeight="7"
                          refX="0"
                          refY="3.5"
                          orient="auto"
                        >
                          <path d="M0,0 L10,3.5 L0,7 Z" fill={color} />
                        </marker>
                      ))}
                    </defs>
                    {arrowPaths.map(({ path, id, srcY, tgtY, color }) => (
                      <g key={id}>
                        {/* Connection line */}
                        <path
                          d={path}
                          fill="none"
                          stroke={color}
                          strokeWidth="2.5"
                          strokeOpacity="0.7"
                          markerEnd={`url(#arrowhead-${id})`}
                        />
                        {/* Source dot */}
                        <circle cx={14} cy={srcY} r={4} fill={color} />
                        {/* Target dot (behind arrowhead) */}
                        <circle cx={14} cy={tgtY} r={4} fill={color} fillOpacity={0.3} />
                      </g>
                    ))}
                  </svg>
                )}

                <div className="space-y-3">
                  {blocks.map((block, _idx) => (
                    <div
                      key={block.id}
                      id={`map-block-wrapper-${block.primaryMarkId.slice(0, 8)}`}
                      data-role="block-wrapper"
                      className="relative"
                    >
                      {/* Connect button — centered vertically, icon center on left border */}
                      {!linkingFrom && onCreateLink && (
                        <button
                          type="button"
                          id={`map-connect-btn-${block.primaryMarkId.slice(0, 8)}`}
                          data-role="connect-btn"
                          onClick={e => {
                            e.stopPropagation();
                            startLinking(block);
                          }}
                          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-violet-100 text-violet-500 hover:bg-violet-200 hover:text-violet-700 flex items-center justify-center transition-colors z-10 shadow-sm"
                          style={{ left: '-10px' }}
                          title="Connect to another block"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                          >
                            <circle cx="5" cy="6" r="2" />
                            <circle cx="19" cy="18" r="2" />
                            <path strokeLinecap="round" d="M7 7l10 10" />
                          </svg>
                        </button>
                      )}

                      <BlockCard
                        ref={handleBlockRef(block.primaryMarkId)}
                        block={block}
                        speaker={block.speakerId ? speakerMap[block.speakerId] : undefined}
                        customColors={customColors}
                        onFallacyClick={onFallacyClick}
                        onRhetoricClick={onRhetoricClick}
                        onStructuralClick={onStructuralClick}
                        isLinkSource={linkingFrom === block.primaryMarkId}
                        isLinkTarget={linkingFrom !== null && linkingFrom !== block.primaryMarkId}
                        isLinking={linkingFrom !== null}
                        onBlockClick={() => handleBlockClickForLinking(block)}
                        linkedTo={linkedToMap[block.primaryMarkId]}
                        isThesis={thesisSet.has(block.primaryMarkId)}
                        onToggleThesis={
                          onToggleThesis ? () => onToggleThesis(block.primaryMarkId) : undefined
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* Link type selection popover */}
      {pendingLink && (
        <LinkTypePopover
          anchorRef={
            {
              current: blockRefs.current[pendingLink.targetMarkId] || null,
            } as React.RefObject<HTMLDivElement | null>
          }
          onSelect={handleLinkTypeSelected}
          onCancel={handleLinkTypeCancel}
        />
      )}
    </div>
  );
};
