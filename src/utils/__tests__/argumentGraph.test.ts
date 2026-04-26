import { wouldCreateCycle, migrateLink, migrateLinks } from '../argumentGraph';
import { ArgumentLink } from '../../models/document';

describe('wouldCreateCycle', () => {
  const makeLink = (
    id: string,
    source: string,
    target: string,
    linkType: 'supports' | 'rebuts' | 'ignores' | 'unspecified' = 'unspecified'
  ): ArgumentLink => ({
    id,
    sourceMarkId: source,
    targetMarkId: target,
    linkType,
    createdAt: Date.now(),
  });

  it('returns false for an empty graph', () => {
    expect(wouldCreateCycle('A', 'B', [])).toBe(false);
  });

  it('returns false for a simple non-cyclic addition', () => {
    const links = [makeLink('1', 'A', 'B')];
    // Adding C → A would not create a cycle
    expect(wouldCreateCycle('C', 'A', links)).toBe(false);
  });

  it('returns true when adding a back-edge creates a cycle', () => {
    // Existing: A → B (A responds to B), B → C (B responds to C)
    const links = [makeLink('1', 'A', 'B'), makeLink('2', 'B', 'C')];
    // Adding C → A: C responds to A
    // Path from target (A) following source→target: A→B, B→C — reaches sourceMarkId (C)
    expect(wouldCreateCycle('C', 'A', links)).toBe(true);
  });

  it('returns false for a valid link in a chain', () => {
    const links = [makeLink('1', 'A', 'B'), makeLink('2', 'B', 'C')];
    // Adding D → C is fine — no cycle
    expect(wouldCreateCycle('D', 'C', links)).toBe(false);
  });

  it('returns true for a direct self-referencing cycle', () => {
    const links = [makeLink('1', 'A', 'B')];
    // Adding B → A: B responds to A
    // From target (A), follow A→B — reaches sourceMarkId (B)
    expect(wouldCreateCycle('B', 'A', links)).toBe(true);
  });

  it('returns false for parallel branches without cycles', () => {
    // A → Root, B → Root, C → A (no cycle)
    const links = [makeLink('1', 'A', 'Root'), makeLink('2', 'B', 'Root'), makeLink('3', 'C', 'A')];
    expect(wouldCreateCycle('D', 'B', links)).toBe(false);
  });

  it('detects cycle through longer chain', () => {
    // A→B, B→C, C→D
    const links = [makeLink('1', 'A', 'B'), makeLink('2', 'B', 'C'), makeLink('3', 'C', 'D')];
    // Adding D → A would create cycle: from target (A), A→B→C→D reaches source (D)
    expect(wouldCreateCycle('D', 'A', links)).toBe(true);
  });
});

describe('migrateLink', () => {
  it('adds unspecified linkType to link without one', () => {
    const link = {
      id: 'test',
      sourceMarkId: 'a',
      targetMarkId: 'b',
      createdAt: 123,
    } as ArgumentLink;
    const migrated = migrateLink(link);
    expect(migrated.linkType).toBe('unspecified');
  });

  it('preserves existing linkType', () => {
    const link: ArgumentLink = {
      id: 'test',
      sourceMarkId: 'a',
      targetMarkId: 'b',
      linkType: 'supports',
      createdAt: 123,
    };
    const migrated = migrateLink(link);
    expect(migrated.linkType).toBe('supports');
  });
});

describe('migrateLinks', () => {
  it('returns empty array for undefined', () => {
    expect(migrateLinks(undefined)).toEqual([]);
  });

  it('migrates all links in array', () => {
    const links = [
      { id: '1', sourceMarkId: 'a', targetMarkId: 'b', createdAt: 1 } as ArgumentLink,
      { id: '2', sourceMarkId: 'c', targetMarkId: 'd', linkType: 'rebuts' as const, createdAt: 2 },
    ];
    const result = migrateLinks(links);
    expect(result[0].linkType).toBe('unspecified');
    expect(result[1].linkType).toBe('rebuts');
  });
});
