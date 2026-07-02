import { ArgumentLink } from '../models/document';

// A single block of marked-up text extracted from the document
export interface MarkupBlock {
  id: string;
  primaryMarkId: string; // First mark's id — used for linking
  text: string;
  speakerId?: string;
  paragraphIndex: number;
  fallacyMarks: import('../components/editor/types').FallacyMark[];
  rhetoricMarks: import('../components/editor/types').RhetoricMark[];
  structuralMarks: import('../components/editor/types').StructuralMark[];
}

/**
 * Tree node representation for the argument tree view
 */
export interface TreeNode {
  block: MarkupBlock;
  children: TreeNode[];
  // Children split by link type
  supportsChildren: TreeNode[];
  rebutsChildren: TreeNode[];
  // Parent references for handling shared children
  parentIds: Set<string>; // block.primaryMarkId of parents
  // Tree state
  isExpanded: boolean;
  depth: number;
  // Ghost/reference node info
  isGhost?: boolean;
  primaryParentId?: string;
  // Thesis status
  isThesis?: boolean;
}

/**
 * Staging area contains unattached blocks (no links)
 */
export interface StagingArea {
  blocks: MarkupBlock[];
}

/**
 * Tree view data structure
 */
export interface ArgumentTree {
  roots: TreeNode[]; // Thesis nodes
  staging: StagingArea;
  // Map for quick lookup
  nodeMap: Map<string, TreeNode>; // key: block.primaryMarkId
}

/**
 * Build a tree structure from blocks and links
 */
export function buildArgumentTree(
  blocks: MarkupBlock[],
  links: ArgumentLink[],
  thesisMarkIds: string[] = []
): ArgumentTree {
  // Create node map for quick lookup
  const nodeMap = new Map<string, TreeNode>();
  blocks.forEach(block => {
    nodeMap.set(block.primaryMarkId, {
      block,
      children: [],
      supportsChildren: [],
      rebutsChildren: [],
      parentIds: new Set(),
      isExpanded: true, // Default to expanded
      depth: 0,
    });
  });

  // Track which blocks have links
  const linkedBlocks = new Set<string>();

  // Build parent-child relationships
  links.forEach(link => {
    const sourceNode = nodeMap.get(link.sourceMarkId);
    const targetNode = nodeMap.get(link.targetMarkId);

    if (!sourceNode || !targetNode) return;

    // Record parent relationship - source responds to target, so target is the parent
    sourceNode.parentIds.add(targetNode.block.primaryMarkId);

    // Add to appropriate child list based on link type
    if (link.linkType === 'supports') {
      targetNode.supportsChildren.push(sourceNode);
    } else {
      targetNode.rebutsChildren.push(sourceNode);
    }

    // Also add to general children list
    targetNode.children.push(sourceNode);

    // Mark both as having links
    linkedBlocks.add(link.sourceMarkId);
    linkedBlocks.add(link.targetMarkId);
  });

  // Identify unattached blocks for staging area
  const stagingBlocks = blocks.filter(block => !linkedBlocks.has(block.primaryMarkId));

  // Identify root nodes (thesis nodes or nodes with no incoming links)
  const rootNodes: TreeNode[] = [];

  // First, add explicitly marked thesis nodes
  thesisMarkIds.forEach(thesisId => {
    const node = nodeMap.get(thesisId);
    if (node) {
      node.depth = 0;
      node.isThesis = true;
      rootNodes.push(node);
    }
  });

  // Also find nodes with no parents (other root trees)
  const existingRootIds = new Set(rootNodes.map(n => n.block.primaryMarkId));
  nodeMap.forEach(node => {
    if (
      node.parentIds.size === 0 &&
      linkedBlocks.has(node.block.primaryMarkId) &&
      !existingRootIds.has(node.block.primaryMarkId)
    ) {
      node.depth = 0;
      rootNodes.push(node);
    }
  });

  // If still no roots (shouldn't happen), pick the first linked block
  if (rootNodes.length === 0 && linkedBlocks.size > 0) {
    const firstLinkedId = Array.from(linkedBlocks)[0];
    const node = nodeMap.get(firstLinkedId);
    if (node) {
      node.depth = 0;
      rootNodes.push(node);
    }
  }

  // Set depths for all nodes recursively
  const setDepths = (node: TreeNode, depth: number) => {
    node.depth = depth;
    node.children.forEach(child => setDepths(child, depth + 1));
  };
  rootNodes.forEach(root => setDepths(root, 0));

  // Handle shared children - identify primary parent
  nodeMap.forEach(node => {
    if (node.parentIds.size > 1) {
      // Choose primary parent (first by document order or creation time)
      // For now, use the parent with the smallest depth
      const parentNodes = Array.from(node.parentIds)
        .map(id => nodeMap.get(id))
        .filter((n): n is TreeNode => n !== undefined)
        .sort((a, b) => a.depth - b.depth);

      if (parentNodes.length > 0) {
        node.primaryParentId = parentNodes[0].block.primaryMarkId;
      }
    }
  });

  return {
    roots: rootNodes,
    staging: {
      blocks: stagingBlocks,
    },
    nodeMap,
  };
}

/**
 * Get all descendants of a node (for search/filter operations)
 */
export function getAllDescendants(node: TreeNode): TreeNode[] {
  const descendants: TreeNode[] = [];

  const traverse = (n: TreeNode) => {
    n.children.forEach(child => {
      descendants.push(child);
      traverse(child);
    });
  };

  traverse(node);
  return descendants;
}

/**
 * Count nodes by link type in a subtree
 */
export function countChildrenByType(node: TreeNode): {
  supports: number;
  rebuts: number;
} {
  return {
    supports: node.supportsChildren.length,
    rebuts: node.rebutsChildren.length,
  };
}

/**
 * Find a node by its block ID in the tree
 */
export function findNode(tree: ArgumentTree, blockId: string): TreeNode | undefined {
  return tree.nodeMap.get(blockId);
}

/**
 * Check if a node should be shown as a ghost under a specific parent
 */
export function isGhostNode(node: TreeNode, parentId: string): boolean {
  return node.parentIds.size > 1 && node.primaryParentId !== parentId;
}

/**
 * Get breadcrumbs for a node (path from root to this node)
 */
export function getNodePath(tree: ArgumentTree, nodeId: string): TreeNode[] {
  const node = tree.nodeMap.get(nodeId);
  if (!node) return [];

  const path: TreeNode[] = [];
  let current: TreeNode | undefined = node;

  // Walk up the tree using parent relationships
  while (current && current.depth > 0) {
    path.unshift(current);

    // Find a parent (prefer primary parent)
    let parent: TreeNode | undefined;
    if (current.primaryParentId) {
      parent = tree.nodeMap.get(current.primaryParentId);
    } else {
      // Find any parent
      for (const parentId of Array.from(current.parentIds)) {
        parent = tree.nodeMap.get(parentId);
        if (parent) break;
      }
    }

    current = parent;
  }

  // Add root if found
  if (current && current.depth === 0) {
    path.unshift(current);
  }

  return path;
}
