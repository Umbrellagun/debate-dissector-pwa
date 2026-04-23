import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Descendant } from 'slate';
import { CustomText, FallacyMark, RhetoricMark, StructuralMark } from './types';
import { FALLACIES } from '../../data/fallacies';
import { RHETORIC_TECHNIQUES } from '../../data/rhetoric';
import { getStructuralMarkupById } from '../../data/structuralMarkup';
import { Speaker, ArgumentLink } from '../../models/document';

// A single block of marked-up text extracted from the document
interface MarkupBlock {
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
  onFallacyClick?: (fallacyId: string) => void;
  onRhetoricClick?: (rhetoricId: string) => void;
  onStructuralClick?: (markupId: string) => void;
  onCreateLink?: (sourceMarkId: string, targetMarkId: string) => void;
  onDeleteLink?: (linkId: string) => void;
}

// Resolve a fallacy mark to its display info
function getFallacyInfo(mark: FallacyMark, customColors?: Record<string, string>) {
  const fallacy = FALLACIES.find(f => f.id === mark.fallacyId);
  const color = customColors?.[mark.fallacyId] || fallacy?.color || mark.color;
  return {
    id: mark.fallacyId,
    label: fallacy?.name || mark.fallacyId,
    color,
    category: 'Fallacy' as const,
    type: 'fallacy' as const,
  };
}

// Resolve a rhetoric mark to its display info
function getRhetoricInfo(mark: RhetoricMark, customColors?: Record<string, string>) {
  const rhetoric = RHETORIC_TECHNIQUES.find(r => r.id === mark.rhetoricId);
  const color = customColors?.[mark.rhetoricId] || rhetoric?.color || mark.color;
  return {
    id: mark.rhetoricId,
    label: rhetoric?.name || mark.rhetoricId,
    color,
    category: 'Rhetoric' as const,
    type: 'rhetoric' as const,
  };
}

// Resolve a structural mark to its display info
function getStructuralInfo(mark: StructuralMark, customColors?: Record<string, string>) {
  const markup = getStructuralMarkupById(mark.markupId);
  const color = customColors?.[mark.markupId] || markup?.color || mark.color;
  return {
    id: mark.markupId,
    label: markup?.name || mark.markupId,
    color,
    category: 'Structure' as const,
    type: 'structural' as const,
  };
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
function extractMarkupBlocks(content: Descendant[]): MarkupBlock[] {
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
        // Same marks — extend the current block
        currentBlock.text += textNode.text;
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

// Determine if a hex color is dark (for text contrast)
function isColorDark(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

type TagInfo = {
  id: string;
  label: string;
  color: string;
  category: string;
  type: 'fallacy' | 'rhetoric' | 'structural';
};

// --- Tag badge for a single mark ---
const MarkTag: React.FC<{ tag: TagInfo; onClick?: () => void }> = ({ tag, onClick }) => (
  <button
    type="button"
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
      linkId: string;
      onDelete: () => void;
    }[];
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
        data-block-id={block.primaryMarkId}
        className={`relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md ${ringClass} ${cursorClass}`}
        style={{ borderLeftWidth: '4px', borderLeftColor: borderColor }}
        onClick={isLinking ? onBlockClick : undefined}
      >
        {/* Tags row */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 pt-3 pb-1">
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
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 group"
              >
                {link.direction === 'outgoing' ? '→' : '←'} {link.label}
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

// --- Main component ---
export const ArgumentMapView: React.FC<ArgumentMapViewProps> = ({
  content,
  speakers = EMPTY_SPEAKERS,
  customColors,
  argumentLinks = EMPTY_LINKS,
  onFallacyClick,
  onRhetoricClick,
  onStructuralClick,
  onCreateLink,
  onDeleteLink,
}) => {
  const blocks = useMemo(() => extractMarkupBlocks(content), [content]);
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null); // primaryMarkId of source
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const blocksContainerRef = useRef<HTMLDivElement | null>(null);
  const [arrowPaths, setArrowPaths] = useState<
    { path: string; id: string; srcY: number; tgtY: number; color: string }[]
  >([]);
  const [svgHeight, setSvgHeight] = useState(0);

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
    return argumentLinks
      .map(link => ({
        ...link,
        sourceBlock: blockByMarkId[link.sourceMarkId],
        targetBlock: blockByMarkId[link.targetMarkId],
      }))
      .filter(l => l.sourceBlock && l.targetBlock);
  }, [argumentLinks, blockByMarkId]);

  // Build linked-to info for each block
  const linkedToMap = useMemo(() => {
    const map: Record<
      string,
      { label: string; direction: 'incoming' | 'outgoing'; linkId: string; onDelete: () => void }[]
    > = {};
    for (const link of resolvedLinks) {
      const srcId = link.sourceBlock!.primaryMarkId;
      const tgtId = link.targetBlock!.primaryMarkId;
      // Outgoing: this block responds to target
      if (!map[srcId]) map[srcId] = [];
      const targetText =
        link.targetBlock!.text.slice(0, 30) + (link.targetBlock!.text.length > 30 ? '…' : '');
      map[srcId].push({
        label: targetText,
        direction: 'outgoing',
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
    const paths: { path: string; id: string; srcY: number; tgtY: number; color: string }[] = [];
    let maxBottom = 0;

    for (let idx = 0; idx < resolvedLinks.length; idx++) {
      const link = resolvedLinks[idx];
      const srcEl = blockRefs.current[link.sourceBlock!.primaryMarkId];
      const tgtEl = blockRefs.current[link.targetBlock!.primaryMarkId];
      if (!srcEl || !tgtEl) continue;

      const srcRect = srcEl.getBoundingClientRect();
      const tgtRect = tgtEl.getBoundingClientRect();

      // Positions relative to the blocks container
      const srcY = srcRect.top - containerRect.top + srcRect.height / 2;
      const tgtY = tgtRect.top - containerRect.top + tgtRect.height / 2;

      const speakerId = link.sourceBlock!.speakerId || '';
      const color = speakerMap[speakerId]?.color || '#9CA3AF';

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
  }, [resolvedLinks, speakerMap]);

  useEffect(() => {
    // Delay to ensure DOM has laid out
    const frame = requestAnimationFrame(() => updateArrows());
    return () => cancelAnimationFrame(frame);
  }, [resolvedLinks.length, blocks.length, updateArrows]);

  // Re-compute on scroll
  const handleScroll = useCallback(() => {
    updateArrows();
  }, [updateArrows]);

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
      // Create link: source responds to target
      onCreateLink?.(linkingFrom, block.primaryMarkId);
      setLinkingFrom(null);
    },
    [linkingFrom, onCreateLink]
  );

  const startLinking = useCallback((block: MarkupBlock) => {
    setLinkingFrom(block.primaryMarkId);
  }, []);

  const cancelLinking = useCallback(() => {
    setLinkingFrom(null);
  }, []);

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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
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
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Summary bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 shrink-0">
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
      </div>

      {/* Blocks canvas with timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative" onScroll={handleScroll}>
        <div className="max-w-2xl mx-auto p-4">
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
                <div key={block.id} className="relative">
                  {/* Connect button — centered vertically, icon center on left border */}
                  {!linkingFrom && onCreateLink && (
                    <button
                      type="button"
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
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
