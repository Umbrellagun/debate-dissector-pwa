import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
  ReactZoomPanPinchContentRef,
} from 'react-zoom-pan-pinch';
import { Speaker, ArgumentLink, LinkType } from '../../models/document';
import { TreeNode } from './TreeNode';
import { StagingArea } from './StagingArea';
import {
  buildArgumentTree,
  TreeNode as TreeNodeType,
  isGhostNode,
  getAllDescendants,
} from '../../utils/argumentTree';
import { extractMarkupBlocks } from './ArgumentMapView';
import { Descendant } from 'slate';

// Stable empty array references to prevent infinite re-render loops
const EMPTY_LINKS: ArgumentLink[] = [];
const EMPTY_SPEAKERS: Speaker[] = [];
const EMPTY_THESIS_IDS: string[] = [];

// Zoom controls overlay
const ZoomControls: React.FC = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div
      id="tree-zoom-controls"
      data-role="zoom-controls"
      className="absolute bottom-3 right-3 z-30 flex items-center gap-1 bg-white rounded-lg shadow-md border border-gray-200 p-1"
    >
      <button
        type="button"
        id="tree-zoom-in"
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
        id="tree-zoom-out"
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
        id="tree-zoom-reset"
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

// Props for TreeView component
export interface TreeViewProps {
  content: Descendant[];
  speakers?: Speaker[];
  customColors?: Record<string, string>;
  argumentLinks?: ArgumentLink[];
  thesisMarkIds?: string[];
  onFallacyClick?: (fallacyId: string) => void;
  onRhetoricClick?: (rhetoricId: string) => void;
  onStructuralClick?: (markupId: string) => void;
  onCreateLink?: (
    sourceMarkId: string,
    targetMarkId: string,
    linkType: 'supports' | 'rebuts'
  ) => void;
  onDeleteLink?: (linkId: string) => void;
  onToggleThesis?: (markId: string) => void;
}

// Confirmation modal for destructive actions
const ConfirmModal: React.FC<{
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, confirmLabel = 'Remove', onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center">
    <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
    <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 max-w-sm w-full mx-4 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// Context menu component
const ContextMenu: React.FC<{
  x: number;
  y: number;
  onClose: () => void;
  onMarkAsThesis: () => void;
  onRemoveFromTree: () => void;
  isThesis: boolean;
  hasChildren: boolean;
}> = ({ x, y, onClose, onMarkAsThesis, onRemoveFromTree, isThesis, hasChildren }) => {
  const [showConfirm, setShowConfirm] = React.useState(false);

  // Close on outside click (only when confirm modal is not showing)
  React.useEffect(() => {
    if (showConfirm) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.context-menu')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, showConfirm]);

  const handleRemove = () => {
    if (hasChildren) {
      setShowConfirm(true);
    } else {
      onRemoveFromTree();
    }
  };

  return (
    <>
      <div
        id="tree-context-menu"
        data-role="context-menu"
        className="context-menu fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-40"
        style={{ top: y, left: x }}
      >
        <button
          type="button"
          onClick={onMarkAsThesis}
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
        >
          {isThesis ? 'Remove as Thesis' : 'Mark as Thesis'}
        </button>
        {!isThesis && (
          <button
            type="button"
            onClick={handleRemove}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors text-red-600"
          >
            Remove from Tree
          </button>
        )}
      </div>
      {showConfirm && (
        <ConfirmModal
          title="Remove block from tree?"
          message="This block has child blocks linked to it. Removing it will also disconnect all child links."
          confirmLabel="Remove"
          onConfirm={onRemoveFromTree}
          onCancel={onClose}
        />
      )}
    </>
  );
};

export const TreeView: React.FC<TreeViewProps> = ({
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
}) => {
  // Build tree structure
  const tree = useMemo(() => {
    const blocks = extractMarkupBlocks(content);
    return buildArgumentTree(blocks, argumentLinks, thesisMarkIds);
  }, [content, argumentLinks, thesisMarkIds]);

  // Component state
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    nodeId: string;
    parentId?: string;
    x: number;
    y: number;
  } | null>(null);
  // Linking mode state
  const [linkingState, setLinkingState] = useState<{
    sourceId: string;
  } | null>(null);
  // Pending link awaiting type selection
  const [pendingLink, setPendingLink] = useState<{
    sourceId: string;
    targetId: string;
  } | null>(null);
  // Refs for tree nodes (for popover positioning)
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Ref for pan/zoom transform control
  const transformRef = useRef<ReactZoomPanPinchContentRef | null>(null);

  // Build speaker lookup
  const speakerMap = useMemo(() => {
    const map: Record<string, Speaker> = {};
    for (const s of speakers) {
      map[s.id] = s;
    }
    return map;
  }, [speakers]);

  // Initialize expanded state
  React.useEffect(() => {
    const initialExpanded = new Set<string>();
    tree.nodeMap.forEach(node => {
      if (node.depth < 2) {
        // Expand first 2 levels by default
        initialExpanded.add(node.block.primaryMarkId);
      }
    });
    setExpandedNodes(initialExpanded);
  }, [tree]);

  // Center the pan/zoom canvas on the topmost cards after layout
  useEffect(() => {
    // Wait for DOM to lay out the tree content
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
  }, [tree, expandedNodes]);

  // Handle node expansion
  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Handle context menu
  const handleContextMenu = useCallback(
    (nodeId: string, event: React.MouseEvent, parentId?: string) => {
      setContextMenu({
        nodeId,
        parentId,
        x: event.clientX,
        y: event.clientY,
      });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Context menu actions
  const handleMarkAsThesis = useCallback(() => {
    if (contextMenu) {
      onToggleThesis?.(contextMenu.nodeId);
      closeContextMenu();
    }
  }, [contextMenu, onToggleThesis, closeContextMenu]);

  const handleRemoveFromTree = useCallback(() => {
    if (contextMenu && onDeleteLink && argumentLinks) {
      if (contextMenu.parentId) {
        // Remove only the link from this specific parent (detach from one parent)
        // Link convention: sourceMarkId = child, targetMarkId = parent
        const linkToParent = argumentLinks.find(
          link =>
            link.sourceMarkId === contextMenu.nodeId && link.targetMarkId === contextMenu.parentId
        );
        if (linkToParent) {
          onDeleteLink(linkToParent.id);
        }
      } else {
        // Root node: remove all links (both directions)
        const sourceLinks = argumentLinks.filter(link => link.sourceMarkId === contextMenu.nodeId);
        const targetLinks = argumentLinks.filter(link => link.targetMarkId === contextMenu.nodeId);
        [...sourceLinks, ...targetLinks].forEach(link => {
          onDeleteLink(link.id);
        });
      }
      closeContextMenu();
    }
  }, [contextMenu, onDeleteLink, argumentLinks, closeContextMenu]);

  // Linking handlers
  const startLinking = useCallback((sourceId: string) => {
    setLinkingState({ sourceId });
  }, []);

  const completeLink = useCallback(
    (targetId: string) => {
      if (!linkingState || !onCreateLink) return;
      // Prevent linking to self
      if (linkingState.sourceId === targetId) return;

      const sourceNode = tree.nodeMap.get(linkingState.sourceId);
      const targetNode = tree.nodeMap.get(targetId);
      if (!sourceNode || !targetNode) return;

      // Check all descendants of source - linking to any would create a cycle
      const sourceDescendants = getAllDescendants(sourceNode);
      const isTargetDescendant = sourceDescendants.some(d => d.block.primaryMarkId === targetId);
      if (isTargetDescendant) {
        console.log('Target is a descendant of source (would create cycle)');
        setLinkingState(null);
        return;
      }

      // Check if target is already a parent of source (link already exists)
      const isSourceChildOfTarget = targetNode.children.some(
        child => child.block.primaryMarkId === linkingState.sourceId
      );
      if (isSourceChildOfTarget) {
        console.log('Link already exists');
        setLinkingState(null);
        return;
      }

      // Show popover for link type selection
      setPendingLink({ sourceId: linkingState.sourceId, targetId });
      setLinkingState(null);
    },
    [linkingState, onCreateLink, tree.nodeMap]
  );

  const handleLinkTypeSelected = useCallback(
    (linkType: LinkType) => {
      if (pendingLink && onCreateLink) {
        onCreateLink(pendingLink.sourceId, pendingLink.targetId, linkType);
      }
      setPendingLink(null);
    },
    [pendingLink, onCreateLink]
  );

  const cancelLinking = useCallback(() => {
    setLinkingState(null);
    setPendingLink(null);
  }, []);

  // Shared TreeNode card renderer (used by both renderTreeNode and renderChildGroup)
  const renderCard = (node: TreeNodeType, parentId?: string) => {
    const isGhost = Boolean(parentId && isGhostNode(node, parentId));
    const speaker = node.block.speakerId ? speakerMap[node.block.speakerId] : undefined;
    const isExpanded = expandedNodes.has(node.block.primaryMarkId);

    return (
      <TreeNode
        ref={(el: HTMLDivElement | null) => {
          nodeRefs.current[node.block.primaryMarkId] = el;
        }}
        node={node}
        speaker={speaker}
        customColors={customColors}
        isGhost={isGhost}
        isExpanded={isExpanded}
        isThesis={node.isThesis}
        onToggleExpand={handleToggleExpand}
        onAddChild={onCreateLink ? () => startLinking(node.block.primaryMarkId) : undefined}
        onContextMenu={(nodeId, event) => handleContextMenu(nodeId, event, parentId)}
        onFallacyClick={onFallacyClick}
        onRhetoricClick={onRhetoricClick}
        onStructuralClick={onStructuralClick}
        onBlockClick={() => {
          if (linkingState && linkingState.sourceId !== node.block.primaryMarkId) {
            completeLink(node.block.primaryMarkId);
          }
        }}
        isLinkTarget={(() => {
          if (!linkingState || linkingState.sourceId === node.block.primaryMarkId) return false;
          const sourceNode = tree.nodeMap.get(linkingState.sourceId);
          if (sourceNode) {
            const sourceDescendants = getAllDescendants(sourceNode);
            const isNodeDescendant = sourceDescendants.some(
              d => d.block.primaryMarkId === node.block.primaryMarkId
            );
            const isSourceChildOfNode = node.children.some(
              child => child.block.primaryMarkId === linkingState.sourceId
            );
            return !isNodeDescendant && !isSourceChildOfNode;
          }
          return true;
        })()}
      />
    );
  };

  // Line thickness constant
  const LINE_W = 1;

  // Connector colors
  const COLORS = {
    supports: '#86efac', // green-300
    rebuts: '#fca5a5', // red-300
    stem: '#d1d5db', // gray-300
  };

  // Renders ALL children of a node in a single CSS Grid.
  // Supports and rebuts children are combined into one flat list with per-child
  // colored connectors. This normalizes the layout regardless of group count.
  //
  // Grid rows: [connector-drop | card+flex-stem | subtree]
  // - Row 1 (24px): horizontal rail segments + vertical drops (colored per-child type)
  // - Row 2 (auto): card + flexible stem that fills gap to the tallest card's height
  // - Row 3 (auto): subtrees — all start at the same Y position
  //
  // When skipStem=true, no stem is rendered above the grid (it's in the parent grid's Row 2).
  const renderNodeChildren = (node: TreeNodeType, skipStem = false) => {
    const nodeId = node.block.primaryMarkId;
    const nodeIdShort = nodeId.slice(0, 8);

    // Flatten all children into a single ordered list with their link type
    const allChildren: { child: TreeNodeType; type: 'supports' | 'rebuts' }[] = [];
    for (const c of node.supportsChildren) {
      allChildren.push({ child: c, type: 'supports' });
    }
    for (const c of node.rebutsChildren) {
      allChildren.push({ child: c, type: 'rebuts' });
    }
    if (allChildren.length === 0) return null;

    const count = allChildren.length;

    return (
      <div
        id={`tree-node-children-${nodeIdShort}`}
        data-role="node-children"
        className="flex flex-col items-center"
      >
        {/* Vertical stem from card (only for root-level calls, not inside grid) */}
        {!skipStem && (
          <div
            id={`tree-stem-${nodeIdShort}`}
            data-role="stem"
            style={{ width: `${LINE_W}px`, height: '20px', backgroundColor: COLORS.stem }}
          />
        )}

        {/* Single unified grid for all children */}
        <div
          id={`tree-children-of-${nodeIdShort}`}
          data-role="children-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${count}, max-content)`,
            gridTemplateRows: '24px auto auto',
          }}
        >
          {allChildren.map(({ child, type: _type }, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === count - 1;
            const isOnly = count === 1;
            const childId = child.block.primaryMarkId;
            const childIdShort = childId.slice(0, 8);
            const connectorColor = COLORS.stem;

            const isGhost = Boolean(nodeId && isGhostNode(child, nodeId));
            const isExpanded = expandedNodes.has(childId);
            const childHasSupports = child.supportsChildren.length > 0;
            const childHasRebuts = child.rebutsChildren.length > 0;
            const childHasVisibleChildren =
              isExpanded && !isGhost && (childHasSupports || childHasRebuts);

            return (
              <React.Fragment key={childId}>
                {/* Row 1: Connector area (24px) — horizontal rail segments + vertical drop */}
                <div
                  id={`tree-connector-${childIdShort}`}
                  data-role="connector-drop"
                  className="relative"
                  style={{ gridRow: 1, gridColumn: idx + 1 }}
                >
                  {/* Horizontal rail: left half */}
                  {!isOnly && !isFirst && (
                    <div
                      id={`tree-rail-left-${childIdShort}`}
                      data-role="rail-left"
                      className="absolute top-0 left-0"
                      style={{
                        width: '50%',
                        height: `${LINE_W}px`,
                        backgroundColor: connectorColor,
                      }}
                    />
                  )}
                  {/* Horizontal rail: right half */}
                  {!isOnly && !isLast && (
                    <div
                      id={`tree-rail-right-${childIdShort}`}
                      data-role="rail-right"
                      className="absolute top-0 right-0"
                      style={{
                        width: '50%',
                        height: `${LINE_W}px`,
                        backgroundColor: connectorColor,
                      }}
                    />
                  )}
                  {/* Vertical drop: center */}
                  <div
                    id={`tree-vertical-drop-${childIdShort}`}
                    data-role="vertical-drop"
                    className="absolute left-1/2 top-0 h-full"
                    style={{
                      width: `${LINE_W}px`,
                      marginLeft: '-0.5px',
                      backgroundColor: connectorColor,
                    }}
                  />
                </div>

                {/* Row 2: Card + flexible stem (stretches to tallest card's height) */}
                <div
                  id={`tree-card-cell-${childIdShort}`}
                  data-role="card-cell"
                  className="flex flex-col items-center mx-3"
                  style={{ gridRow: 2, gridColumn: idx + 1 }}
                >
                  <div className="min-w-64 w-min">{renderCard(child, nodeId)}</div>
                  {/* Flexible stem: fills gap between shorter card and row boundary */}
                  {childHasVisibleChildren && (
                    <div
                      id={`tree-flex-stem-${childIdShort}`}
                      data-role="flex-stem"
                      className="flex-1"
                      style={{
                        width: `${LINE_W}px`,
                        minHeight: '16px',
                        backgroundColor: COLORS.stem,
                      }}
                    />
                  )}
                </div>

                {/* Row 3: Subtree — all siblings' subtrees start at the same Y */}
                <div
                  id={`tree-subtree-${childIdShort}`}
                  data-role="subtree-cell"
                  className="flex flex-col items-center"
                  style={{ gridRow: 3, gridColumn: idx + 1 }}
                >
                  {childHasVisibleChildren && renderNodeChildren(child, true)}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // Render tree node — top-down org chart layout (used for root nodes only)
  const renderTreeNode = (node: TreeNodeType, parentId?: string) => {
    const isGhost = Boolean(parentId && isGhostNode(node, parentId));
    const isExpanded = expandedNodes.has(node.block.primaryMarkId);
    const hasSupports = node.supportsChildren.length > 0;
    const hasRebuts = node.rebutsChildren.length > 0;
    const hasVisibleChildren = isExpanded && !isGhost && (hasSupports || hasRebuts);

    return (
      <div
        key={node.block.primaryMarkId}
        id={`tree-node-${node.block.primaryMarkId.slice(0, 8)}`}
        data-role="tree-node"
        className="flex flex-col items-center"
      >
        {/* The node card */}
        <div className="min-w-64 w-min">{renderCard(node, parentId)}</div>

        {/* Children section (with stem, since this is the top-level renderTreeNode) */}
        {hasVisibleChildren && renderNodeChildren(node)}
      </div>
    );
  };

  // Summary counts
  const summary = useMemo(() => {
    const totalBlocks = tree.nodeMap.size;
    const unattachedCount = tree.staging.blocks.length;
    const thesisCount = tree.roots.length;

    return {
      total: totalBlocks,
      unattached: unattachedCount,
      thesis: thesisCount,
    };
  }, [tree]);

  if (tree.nodeMap.size === 0) {
    return (
      <div
        id="tree-view-empty"
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
      id="tree-view-root"
      data-role="tree-view"
      className="flex-1 flex flex-col min-h-0 bg-gray-50 overflow-hidden"
    >
      {/* Summary bar */}
      <div
        id="tree-summary-bar"
        data-role="summary-bar"
        className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 shrink-0"
      >
        {linkingState ? (
          // Linking mode UI
          <>
            <span className="text-xs font-medium text-violet-600">
              Click a target block to link:
            </span>
            <button
              type="button"
              onClick={cancelLinking}
              className="ml-auto text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          // Normal summary UI
          <>
            <span className="text-xs font-medium text-gray-500">
              {summary.total} passage{summary.total !== 1 ? 's' : ''}
            </span>
            {summary.thesis > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                {summary.thesis} thesis{summary.thesis !== 1 ? 'es' : ''}
              </span>
            )}
            {summary.unattached > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-700">
                {summary.unattached} unattached
              </span>
            )}
            <div className="ml-auto text-xs text-gray-400">Tree View</div>
          </>
        )}
      </div>

      {/* Tree content — pannable/zoomable canvas */}
      <div id="tree-content-area" data-role="content-area" className="flex-1 min-h-0 relative">
        {/* Staging Area for unattached blocks — outside the pan canvas */}
        {tree.staging.blocks.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-20 p-2">
            <StagingArea
              blocks={tree.staging.blocks}
              speakers={speakers}
              onConnectBlock={onCreateLink ? blockId => startLinking(blockId) : undefined}
            />
          </div>
        )}
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={0.15}
          maxScale={2}
          limitToBounds={false}
          smooth={false}
          panning={{ velocityDisabled: true }}
          wheel={{ step: 0.2 }}
        >
          <ZoomControls />
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ padding: '2rem' }}
          >
            <div
              id="tree-roots-container"
              data-role="roots-container"
              className="flex flex-col items-center gap-10"
            >
              {/* Render explicit thesis roots */}
              {tree.roots
                .filter(r => r.isThesis)
                .map(root => (
                  <div
                    key={root.block.primaryMarkId}
                    id={`tree-thesis-root-${root.block.primaryMarkId.slice(0, 8)}`}
                    data-role="thesis-root"
                    className="flex flex-col items-center"
                  >
                    <div className="text-xs font-medium text-amber-600 mb-3 uppercase tracking-wide">
                      Thesis
                    </div>
                    {renderTreeNode(root)}
                  </div>
                ))}

              {/* Render non-thesis root nodes */}
              {tree.roots
                .filter(r => !r.isThesis)
                .map(root => (
                  <div
                    key={root.block.primaryMarkId}
                    id={`tree-root-${root.block.primaryMarkId.slice(0, 8)}`}
                    data-role="root-node"
                  >
                    {renderTreeNode(root)}
                  </div>
                ))}

              {/* If no roots at all, show depth-0 nodes */}
              {tree.roots.length === 0 && (
                <div className="flex flex-col items-center gap-6">
                  {Array.from(tree.nodeMap.values())
                    .filter(node => node.depth === 0)
                    .map(node => renderTreeNode(node))}
                </div>
              )}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onMarkAsThesis={handleMarkAsThesis}
          onRemoveFromTree={handleRemoveFromTree}
          isThesis={thesisMarkIds.includes(contextMenu.nodeId)}
          hasChildren={(() => {
            const node = tree.nodeMap.get(contextMenu.nodeId);
            return node ? node.children.length > 0 : false;
          })()}
        />
      )}

      {/* Link type popover */}
      {pendingLink && (
        <TreeLinkTypePopover
          anchorEl={nodeRefs.current[pendingLink.targetId] || null}
          onSelect={handleLinkTypeSelected}
          onCancel={cancelLinking}
        />
      )}
    </div>
  );
};

// --- Link type popover for tree view ---
const TREE_LINK_TYPE_OPTIONS: {
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

const TreeLinkTypePopover: React.FC<{
  anchorEl: HTMLDivElement | null;
  onSelect: (linkType: LinkType) => void;
  onCancel: () => void;
}> = ({ anchorEl, onSelect, onCancel }) => {
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);

  React.useEffect(() => {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(8, rect.left + rect.width / 2 - 120),
      });
    }
  }, [anchorEl]);

  // Close on outside click
  React.useEffect(() => {
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
      id="tree-link-popover"
      data-role="link-type-popover"
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-60"
      style={{ top: position.top, left: position.left }}
    >
      <p className="text-xs font-medium text-gray-600 mb-2">How does this relate?</p>
      <div className="space-y-1.5">
        {TREE_LINK_TYPE_OPTIONS.map(opt => (
          <button
            key={opt.type}
            id={`tree-link-option-${opt.type}`}
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
