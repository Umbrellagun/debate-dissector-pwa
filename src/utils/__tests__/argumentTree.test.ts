import { buildArgumentTree, getAllDescendants, getNodePath, isGhostNode } from '../argumentTree';
import { ArgumentLink } from '../../models/document';

const makeBlock = (
  id: string,
  text: string,
  marks: {
    fallacy?: { id: string; fallacyId: string; color: string; appliedAt?: number }[];
    rhetoric?: { id: string; rhetoricId: string; color: string; appliedAt?: number }[];
    structural?: { id: string; markupId: string; color: string; appliedAt?: number }[];
  } = {},
  paragraphIndex = 0,
  speakerId?: string
) => ({
  id,
  primaryMarkId: id,
  text,
  paragraphIndex,
  speakerId,
  fallacyMarks: (marks.fallacy || []).map(m => ({ ...m, appliedAt: m.appliedAt ?? Date.now() })),
  rhetoricMarks: (marks.rhetoric || []).map(m => ({ ...m, appliedAt: m.appliedAt ?? Date.now() })),
  structuralMarks: (marks.structural || []).map(m => ({
    ...m,
    appliedAt: m.appliedAt ?? Date.now(),
  })),
});

const makeLink = (
  id: string,
  source: string,
  target: string,
  linkType: 'supports' | 'rebuts' = 'supports'
): ArgumentLink => ({
  id,
  sourceMarkId: source,
  targetMarkId: target,
  linkType,
  createdAt: Date.now(),
});

describe('buildArgumentTree', () => {
  it('returns empty tree for no blocks', () => {
    const tree = buildArgumentTree([], []);
    expect(tree.roots).toEqual([]);
    expect(tree.staging.blocks).toEqual([]);
    expect(tree.nodeMap.size).toBe(0);
  });

  it('puts all unattached blocks in staging', () => {
    const blocks = [makeBlock('a', 'Block A'), makeBlock('b', 'Block B')];
    const tree = buildArgumentTree(blocks, []);
    expect(tree.staging.blocks).toHaveLength(2);
    expect(tree.staging.blocks[0].primaryMarkId).toBe('a');
    expect(tree.staging.blocks[1].primaryMarkId).toBe('b');
    expect(tree.roots).toHaveLength(0);
  });

  it('creates tree from linked blocks', () => {
    const blocks = [makeBlock('a', 'Thesis'), makeBlock('b', 'Supporting argument')];
    const links = [makeLink('1', 'b', 'a', 'supports')];
    const tree = buildArgumentTree(blocks, links);

    expect(tree.staging.blocks).toHaveLength(0);
    expect(tree.roots).toHaveLength(1);
    expect(tree.roots[0].block.primaryMarkId).toBe('a');
    expect(tree.roots[0].children).toHaveLength(1);
    expect(tree.roots[0].children[0].block.primaryMarkId).toBe('b');
  });

  it('categorizes children by link type', () => {
    const blocks = [
      makeBlock('thesis', 'Thesis'),
      makeBlock('pro1', 'Pro argument'),
      makeBlock('con1', 'Con argument'),
    ];
    const links = [
      makeLink('1', 'pro1', 'thesis', 'supports'),
      makeLink('2', 'con1', 'thesis', 'rebuts'),
    ];
    const tree = buildArgumentTree(blocks, links);

    const thesisNode = tree.roots[0];
    expect(thesisNode.supportsChildren).toHaveLength(1);
    expect(thesisNode.rebutsChildren).toHaveLength(1);
    expect(thesisNode.supportsChildren[0].block.primaryMarkId).toBe('pro1');
    expect(thesisNode.rebutsChildren[0].block.primaryMarkId).toBe('con1');
  });

  it('uses thesisMarkIds as roots when provided', () => {
    const blocks = [
      makeBlock('a', 'Thesis A'),
      makeBlock('b', 'Thesis B'),
      makeBlock('c', 'Linked to A'),
    ];
    const links = [makeLink('1', 'c', 'a', 'supports')];
    const tree = buildArgumentTree(blocks, links, ['a', 'b']);

    expect(tree.roots).toHaveLength(2);
    expect(tree.roots[0].block.primaryMarkId).toBe('a');
    expect(tree.roots[1].block.primaryMarkId).toBe('b');
  });

  it('sets depths correctly in tree', () => {
    const blocks = [
      makeBlock('root', 'Root'),
      makeBlock('child', 'Child'),
      makeBlock('grandchild', 'Grandchild'),
    ];
    const links = [
      makeLink('1', 'child', 'root', 'supports'),
      makeLink('2', 'grandchild', 'child', 'supports'),
    ];
    const tree = buildArgumentTree(blocks, links);

    const rootNode = tree.roots[0];
    expect(rootNode.depth).toBe(0);
    expect(rootNode.children[0].depth).toBe(1);
    expect(rootNode.children[0].children[0].depth).toBe(2);
  });

  it('handles shared children (multiple parents)', () => {
    const blocks = [
      makeBlock('thesis', 'Thesis'),
      makeBlock('support1', 'Support 1'),
      makeBlock('support2', 'Support 2'),
      makeBlock('shared', 'Shared argument'),
    ];
    const links = [
      makeLink('1', 'support1', 'thesis', 'supports'),
      makeLink('2', 'support2', 'thesis', 'supports'),
      makeLink('3', 'shared', 'support1', 'supports'),
      makeLink('4', 'shared', 'support2', 'supports'),
    ];
    const tree = buildArgumentTree(blocks, links);

    const sharedNode = tree.nodeMap.get('shared')!;
    expect(sharedNode.parentIds.size).toBe(2);
    expect(sharedNode.primaryParentId).toBe('support1'); // First parent by depth
  });
});

describe('getAllDescendants', () => {
  it('returns empty array for leaf node', () => {
    const node = {
      block: {} as ReturnType<typeof makeBlock>,
      children: [],
      supportsChildren: [],
      rebutsChildren: [],
      parentIds: new Set<string>(),
      isExpanded: true,
      depth: 0,
    };
    expect(getAllDescendants(node)).toEqual([]);
  });

  it('returns all descendants in tree', () => {
    const grandchild = {
      block: {} as ReturnType<typeof makeBlock>,
      children: [],
      supportsChildren: [],
      rebutsChildren: [],
      parentIds: new Set<string>(),
      isExpanded: true,
      depth: 2,
    };
    const child = {
      block: {} as ReturnType<typeof makeBlock>,
      children: [grandchild],
      supportsChildren: [],
      rebutsChildren: [],
      parentIds: new Set<string>(),
      isExpanded: true,
      depth: 1,
    };
    const root = {
      block: {} as ReturnType<typeof makeBlock>,
      children: [child],
      supportsChildren: [],
      rebutsChildren: [],
      parentIds: new Set<string>(),
      isExpanded: true,
      depth: 0,
    };

    expect(getAllDescendants(root)).toEqual([child, grandchild]);
  });
});

describe('isGhostNode', () => {
  it('returns false for node with single parent', () => {
    const node = {
      block: { primaryMarkId: 'a' } as ReturnType<typeof makeBlock>,
      children: [],
      supportsChildren: [],
      rebutsChildren: [],
      parentIds: new Set<string>(['parent1']),
      isExpanded: true,
      depth: 1,
    };
    expect(isGhostNode(node, 'parent1')).toBe(false);
  });

  it('returns false for node with multiple parents when checking primary parent', () => {
    const node = {
      block: { primaryMarkId: 'a' } as ReturnType<typeof makeBlock>,
      children: [],
      supportsChildren: [],
      rebutsChildren: [],
      parentIds: new Set<string>(['parent1', 'parent2']),
      primaryParentId: 'parent1',
      isExpanded: true,
      depth: 1,
    };
    expect(isGhostNode(node, 'parent1')).toBe(false);
  });

  it('returns true for node with multiple parents when checking non-primary parent', () => {
    const node = {
      block: { primaryMarkId: 'a' } as ReturnType<typeof makeBlock>,
      children: [],
      supportsChildren: [],
      rebutsChildren: [],
      parentIds: new Set<string>(['parent1', 'parent2']),
      primaryParentId: 'parent1',
      isExpanded: true,
      depth: 1,
    };
    expect(isGhostNode(node, 'parent2')).toBe(true);
  });
});

describe('getNodePath', () => {
  it('returns array with root node for root', () => {
    const tree = buildArgumentTree(
      [
        {
          id: 'a',
          primaryMarkId: 'a',
          text: 'A',
          paragraphIndex: 0,
          fallacyMarks: [],
          rhetoricMarks: [],
          structuralMarks: [],
        },
      ],
      []
    );
    const path = getNodePath(tree, 'a');
    expect(path).toHaveLength(1);
    expect(path[0].block.primaryMarkId).toBe('a');
  });
});
