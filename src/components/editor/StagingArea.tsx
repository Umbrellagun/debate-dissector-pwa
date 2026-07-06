import React, { useState, useMemo } from 'react';
import { Speaker } from '../../models/document';
import { MarkupBlock } from './ArgumentMapView';

// Filter and sort options
export type StagingFilter = 'all' | 'fallacy' | 'rhetoric' | 'structural';
export type StagingSort = 'document' | 'type' | 'speaker';

export interface StagingAreaProps {
  blocks: MarkupBlock[];
  speakers: Speaker[];
  onConnectBlock?: (blockId: string) => void;
  onCompleteLink?: (targetId: string) => void;
  isLinking?: boolean;
  expanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
  onDragStart?: (blockId: string) => void;
}

export const StagingArea: React.FC<StagingAreaProps> = ({
  blocks,
  speakers,
  onConnectBlock,
  onCompleteLink,
  isLinking = false,
  expanded,
  onToggleExpanded,
  onDragStart,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(true);
  // Support controlled or uncontrolled expanded state
  const isExpanded = expanded !== undefined ? expanded : internalExpanded;
  const toggleExpanded = () => {
    const next = !isExpanded;
    if (onToggleExpanded) onToggleExpanded(next);
    else setInternalExpanded(next);
  };
  const [filter, setFilter] = useState<StagingFilter>('all');
  const [sort, setSort] = useState<StagingSort>('document');

  const speakerMap = useMemo(() => {
    const map: Record<string, Speaker> = {};
    for (const s of speakers) {
      map[s.id] = s;
    }
    return map;
  }, [speakers]);

  // Filter and sort blocks
  const filteredBlocks = useMemo(() => {
    let result = [...blocks];

    // Filter
    if (filter !== 'all') {
      result = result.filter(block => {
        if (filter === 'fallacy') return block.fallacyMarks.length > 0;
        if (filter === 'rhetoric') return block.rhetoricMarks.length > 0;
        if (filter === 'structural') return block.structuralMarks.length > 0;
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sort === 'document') {
        return a.paragraphIndex - b.paragraphIndex;
      }
      if (sort === 'type') {
        const getPrimaryType = (block: MarkupBlock) => {
          if (block.fallacyMarks.length > 0) return 'fallacy';
          if (block.rhetoricMarks.length > 0) return 'rhetoric';
          if (block.structuralMarks.length > 0) return 'structural';
          return '';
        };
        return getPrimaryType(a).localeCompare(getPrimaryType(b));
      }
      if (sort === 'speaker') {
        const speakerA = a.speakerId || '';
        const speakerB = b.speakerId || '';
        return speakerA.localeCompare(speakerB);
      }
      return 0;
    });

    return result;
  }, [blocks, filter, sort]);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div
      id="tree-staging-area"
      data-role="staging-area"
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4"
    >
      {/* Header */}
      <button
        type="button"
        id="staging-area-toggle"
        data-role="staging-toggle"
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Unattached Blocks</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
            {blocks.length}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 max-h-[40vh] overflow-y-auto">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <select
              id="staging-filter-select"
              data-role="staging-filter"
              value={filter}
              onChange={e => setFilter(e.target.value as StagingFilter)}
              className="text-sm px-2 py-1 rounded border border-gray-300 bg-white"
            >
              <option value="all">Filter: All</option>
              <option value="fallacy">Fallacy</option>
              <option value="rhetoric">Rhetoric</option>
              <option value="structural">Structural</option>
            </select>

            <select
              id="staging-sort-select"
              data-role="staging-sort"
              value={sort}
              onChange={e => setSort(e.target.value as StagingSort)}
              className="text-sm px-2 py-1 rounded border border-gray-300 bg-white"
            >
              <option value="document">Sort: Document Order</option>
              <option value="type">Sort: Type</option>
              <option value="speaker">Sort: Speaker</option>
            </select>

            <span className="text-xs text-gray-400 ml-auto">{filteredBlocks.length} shown</span>
          </div>

          {/* Block grid */}
          {filteredBlocks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredBlocks.map(block => {
                const speaker = block.speakerId ? speakerMap[block.speakerId] : undefined;
                const primaryType =
                  block.fallacyMarks.length > 0
                    ? 'fallacy'
                    : block.rhetoricMarks.length > 0
                      ? 'rhetoric'
                      : 'structural';

                const typeColors: Record<string, string> = {
                  fallacy: 'border-l-red-400 bg-red-50',
                  rhetoric: 'border-l-blue-400 bg-blue-50',
                  structural: 'border-l-purple-400 bg-purple-50',
                };

                const typeLabels: Record<string, string> = {
                  fallacy: 'Fallacy',
                  rhetoric: 'Rhetoric',
                  structural: 'Structural',
                };

                return (
                  <div
                    key={block.primaryMarkId}
                    id={`staging-block-${block.primaryMarkId.slice(0, 8)}`}
                    data-role="staging-block"
                    data-block-id={block.primaryMarkId}
                    className={`group relative p-3 rounded border-l-2 ${
                      typeColors[primaryType]
                    } bg-white hover:shadow-md transition-all cursor-pointer ${
                      isLinking ? 'ring-2 ring-emerald-400 ring-offset-1' : ''
                    }`}
                    draggable={!isLinking}
                    onDragStart={() => onDragStart?.(block.primaryMarkId)}
                    onClick={() => {
                      if (isLinking && onCompleteLink) {
                        onCompleteLink(block.primaryMarkId);
                      } else {
                        onConnectBlock?.(block.primaryMarkId);
                      }
                    }}
                  >
                    {/* Text preview */}
                    <p className="text-xs text-gray-700 line-clamp-2 mb-2">
                      {block.text.slice(0, 60)}
                      {block.text.length > 60 ? '…' : ''}
                    </p>

                    {/* Type badge */}
                    <span className="text-[10px] font-medium text-gray-500">
                      {typeLabels[primaryType]}
                    </span>

                    {/* Speaker */}
                    {speaker && (
                      <span className="block text-[10px] mt-1" style={{ color: speaker.color }}>
                        {speaker.name}
                      </span>
                    )}

                    {/* Connect button on hover */}
                    <button
                      type="button"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 w-5 h-5 rounded bg-green-100 text-green-600 flex items-center justify-center transition-opacity"
                      title="Connect this block"
                      onClick={e => {
                        e.stopPropagation();
                        onConnectBlock?.(block.primaryMarkId);
                      }}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">No blocks match the current filter</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
