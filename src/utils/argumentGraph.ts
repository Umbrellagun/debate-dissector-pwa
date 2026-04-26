import { ArgumentLink, LinkType } from '../models/document';

/**
 * Check if creating a link from sourceMarkId → targetMarkId would introduce
 * a cycle in the directed graph.
 *
 * Link direction: sourceMarkId is the "responding block" (child in tree),
 * targetMarkId is the "block being responded to" (parent in tree).
 *
 * A cycle would occur if targetMarkId is already a descendant of sourceMarkId,
 * i.e. there is already a directed path from targetMarkId back to sourceMarkId
 * following source→target edges.
 */
export function wouldCreateCycle(
  sourceMarkId: string,
  targetMarkId: string,
  existingLinks: ArgumentLink[]
): boolean {
  // BFS from targetMarkId following outgoing links (source→target)
  // If we reach sourceMarkId, creating this link would form a cycle.
  const visited = new Set<string>();
  const queue = [targetMarkId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === sourceMarkId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    // Follow all outgoing links FROM this node (where this node is the source)
    for (const link of existingLinks) {
      if (link.sourceMarkId === current) {
        queue.push(link.targetMarkId);
      }
    }
  }

  return false;
}

/**
 * Migrate a link that may be missing the `linkType` field (from pre-Phase A data).
 * Returns the link with `linkType` defaulting to `'unspecified'` if missing.
 */
export function migrateLink(link: ArgumentLink): ArgumentLink {
  if (!link.linkType) {
    return { ...link, linkType: 'unspecified' as LinkType };
  }
  return link;
}

/**
 * Migrate an array of links, ensuring all have a `linkType` field.
 */
export function migrateLinks(links: ArgumentLink[] | undefined): ArgumentLink[] {
  if (!links) return [];
  return links.map(migrateLink);
}

/**
 * Color associated with each link type for visual connectors.
 */
export const LINK_TYPE_COLORS: Record<LinkType, string> = {
  supports: '#10B981', // green
  rebuts: '#EF4444', // red
  ignores: '#F59E0B', // amber
  unspecified: '#9CA3AF', // gray
};

/**
 * Label associated with each link type.
 */
export const LINK_TYPE_LABELS: Record<LinkType, string> = {
  supports: 'Supports',
  rebuts: 'Rebuts',
  ignores: 'Ignores',
  unspecified: 'Linked',
};
