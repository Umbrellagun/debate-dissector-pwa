import React, { forwardRef } from 'react';
import { Speaker } from '../../models/document';
import { TreeNode as TreeNodeType, countChildrenByType } from '../../utils/argumentTree';
import { LINK_TYPE_COLORS } from '../../utils/argumentGraph';
import {
  TagInfo,
  getFallacyInfo,
  getRhetoricInfo,
  getStructuralInfo,
  isColorDark,
} from './markTagUtils';

const MarkTag: React.FC<{ tag: TagInfo; onClick?: () => void }> = ({ tag, onClick }) => (
  <button
    type="button"
    id={`mark-tag-${tag.type}-${tag.id}`}
    data-role="mark-tag"
    onClick={onClick}
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer hover:opacity-80 transition-opacity shrink-0 whitespace-nowrap"
    style={{
      backgroundColor: tag.color,
      color: isColorDark(tag.color) ? '#fff' : '#1f2937',
    }}
  >
    <span className="opacity-70">{tag.category}:</span> {tag.label}
  </button>
);

// Props for TreeNode component
export interface TreeNodeProps {
  node: TreeNodeType;
  speaker?: Speaker;
  customColors?: Record<string, string>;
  isGhost?: boolean;
  isExpanded?: boolean;
  isThesis?: boolean;
  onToggleExpand?: (nodeId: string) => void;
  onAddChild?: (nodeId: string) => void;
  onContextMenu?: (nodeId: string, event: React.MouseEvent) => void;
  onFallacyClick?: (fallacyId: string) => void;
  onRhetoricClick?: (rhetoricId: string) => void;
  onStructuralClick?: (markupId: string) => void;
  onBlockClick?: () => void;
  isLinkTarget?: boolean;
}

export const TreeNode = forwardRef<HTMLDivElement, TreeNodeProps>(
  (
    {
      node,
      speaker,
      customColors,
      isGhost = false,
      isExpanded = false,
      isThesis = false,
      onToggleExpand,
      onAddChild,
      onContextMenu,
      onFallacyClick,
      onRhetoricClick,
      onStructuralClick,
      onBlockClick,
      isLinkTarget = false,
    },
    ref
  ) => {
    const { block } = node;
    const childCounts = countChildrenByType(node);

    // Extract tags from marks using shared utilities
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

    const hasChildren = node.children.length > 0;
    const borderColor = speaker?.color || '#9CA3AF';

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      onContextMenu?.(block.primaryMarkId, e);
    };

    const handleExpandToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleExpand?.(block.primaryMarkId);
    };

    const handleAddChild = (e: React.MouseEvent) => {
      e.stopPropagation();
      onAddChild?.(block.primaryMarkId);
    };

    return (
      <div
        ref={ref}
        id={`tree-card-${block.primaryMarkId.slice(0, 8)}`}
        data-node-id={block.primaryMarkId}
        data-role="tree-card"
        className={`relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md ${isLinkTarget ? 'ring-2 ring-violet-400 cursor-pointer' : ''}`}
        style={{ borderLeftWidth: '4px', borderLeftColor: borderColor }}
        onClick={onBlockClick}
        onContextMenu={handleContextMenu}
      >
        {/* Header row with tags, speaker, thesis badge and actions */}
        <div
          id={`tree-card-header-${block.primaryMarkId.slice(0, 8)}`}
          data-role="card-header"
          className="flex items-center gap-2 px-3 py-2 border-b border-gray-100"
        >
          {/* Tags row - at top like timeline */}
          <div className="flex items-center gap-1.5">
            {tags.map((tag, i) => (
              <MarkTag
                key={i}
                tag={tag}
                onClick={
                  tag.type === 'fallacy'
                    ? () => onFallacyClick?.(tag.id)
                    : tag.type === 'rhetoric'
                      ? () => onRhetoricClick?.(tag.id)
                      : () => onStructuralClick?.(tag.id)
                }
              />
            ))}
          </div>

          {/* Thesis badge */}
          {isThesis && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 shrink-0">
              Thesis
            </span>
          )}

          {/* Speaker */}
          {speaker && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 whitespace-nowrap"
              style={{ backgroundColor: `${speaker.color}18`, color: speaker.color }}
            >
              {speaker.name}
            </span>
          )}

          {/* Action buttons */}
          <div className="ml-auto flex items-center gap-1 shrink-0">
            {/* Add child button */}
            {onAddChild && (
              <button
                type="button"
                id={`tree-add-child-${block.primaryMarkId.slice(0, 8)}`}
                data-role="add-child-btn"
                onClick={handleAddChild}
                className="w-5 h-5 rounded bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors"
                title="Add child link"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}

            {/* Expand/collapse button */}
            {hasChildren && onToggleExpand && (
              <button
                type="button"
                id={`tree-expand-${block.primaryMarkId.slice(0, 8)}`}
                data-role="expand-btn"
                onClick={handleExpandToggle}
                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                  isExpanded
                    ? 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isExpanded ? 'Collapse children' : 'Expand children'}
              >
                {isExpanded ? (
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            )}

            {/* Context menu button */}
            <button
              type="button"
              id={`tree-context-btn-${block.primaryMarkId.slice(0, 8)}`}
              data-role="context-menu-btn"
              onClick={handleContextMenu}
              className="w-5 h-5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors"
              title="More options"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          id={`tree-card-content-${block.primaryMarkId.slice(0, 8)}`}
          data-role="card-content"
          className="px-3 py-2"
        >
          <p className="text-sm text-gray-800 leading-relaxed">
            {block.text.length > 100 ? block.text.slice(0, 100) + '…' : block.text}
          </p>
        </div>

        {/* Child count bar */}
        {(childCounts.supports > 0 || childCounts.rebuts > 0) && (
          <div
            id={`tree-card-counts-${block.primaryMarkId.slice(0, 8)}`}
            data-role="child-count-bar"
            className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-t border-gray-100 text-[11px]"
          >
            {childCounts.supports > 0 && (
              <span className="flex items-center gap-1 text-green-600">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: LINK_TYPE_COLORS.supports }}
                />
                {childCounts.supports} Supports
              </span>
            )}
            {childCounts.rebuts > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: LINK_TYPE_COLORS.rebuts }}
                />
                {childCounts.rebuts} Rebuts
              </span>
            )}
          </div>
        )}

        {/* Ghost indicator */}
        {isGhost && (
          <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 italic">
            (also under{' '}
            {node.primaryParentId ? `node ${node.primaryParentId.slice(0, 8)}…` : 'another parent'})
          </div>
        )}
      </div>
    );
  }
);

TreeNode.displayName = 'TreeNode';
