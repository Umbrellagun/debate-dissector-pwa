import {
  STRUCTURAL_MARKUPS,
  STRUCTURAL_MARKUP_CATEGORIES,
  getStructuralMarkupById,
  getStructuralMarkupsByIds,
  getCategoryLabel,
  StructuralMarkupType,
} from '../structuralMarkup';

describe('STRUCTURAL_MARKUPS data', () => {
  describe('data integrity', () => {
    it('should have structural markups defined', () => {
      expect(STRUCTURAL_MARKUPS).toBeDefined();
      expect(Array.isArray(STRUCTURAL_MARKUPS)).toBe(true);
      expect(STRUCTURAL_MARKUPS.length).toBeGreaterThan(0);
    });

    it('should have unique IDs for all markups', () => {
      const ids = STRUCTURAL_MARKUPS.map(m => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique names for all markups', () => {
      const names = STRUCTURAL_MARKUPS.map(m => m.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have valid hex color codes for all markups', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      for (const markup of STRUCTURAL_MARKUPS) {
        expect(markup.color).toMatch(hexColorRegex);
      }
    });

    it('should have non-empty descriptions for all markups', () => {
      for (const markup of STRUCTURAL_MARKUPS) {
        expect(markup.description).toBeDefined();
        expect(markup.description.length).toBeGreaterThan(0);
      }
    });

    it('should have non-empty names for all markups', () => {
      for (const markup of STRUCTURAL_MARKUPS) {
        expect(markup.name).toBeDefined();
        expect(markup.name.length).toBeGreaterThan(0);
      }
    });

    it('should have non-empty IDs for all markups', () => {
      for (const markup of STRUCTURAL_MARKUPS) {
        expect(markup.id).toBeDefined();
        expect(markup.id.length).toBeGreaterThan(0);
      }
    });

    it('should have icon identifiers for all markups', () => {
      for (const markup of STRUCTURAL_MARKUPS) {
        expect(markup.icon).toBeDefined();
        expect(markup.icon.length).toBeGreaterThan(0);
      }
    });

    it('should have unique keyboard shortcuts where defined', () => {
      const shortcuts = STRUCTURAL_MARKUPS.filter(m => m.shortcut).map(m => m.shortcut);
      const uniqueShortcuts = new Set(shortcuts);
      expect(uniqueShortcuts.size).toBe(shortcuts.length);
    });
  });

  describe('expected markup types', () => {
    const expectedTypes: StructuralMarkupType[] = [
      'claim',
      'evidence',
      'unsupported',
      'statistic',
      'quote',
      'anecdote',
      'unaddressed',
    ];

    it.each(expectedTypes)('should include %s markup', typeId => {
      const found = STRUCTURAL_MARKUPS.find(m => m.id === typeId);
      expect(found).toBeDefined();
    });

    it('should have exactly the expected number of markup types', () => {
      expect(STRUCTURAL_MARKUPS.length).toBe(expectedTypes.length);
    });
  });

  describe('category organization', () => {
    it('should have assertions and support categories', () => {
      expect(STRUCTURAL_MARKUP_CATEGORIES.assertions).toBeDefined();
      expect(STRUCTURAL_MARKUP_CATEGORIES.support).toBeDefined();
    });

    it('should place claim and unsupported in assertions', () => {
      expect(STRUCTURAL_MARKUP_CATEGORIES.assertions).toContain('claim');
      expect(STRUCTURAL_MARKUP_CATEGORIES.assertions).toContain('unsupported');
    });

    it('should place evidence, statistic, quote, and anecdote in support', () => {
      expect(STRUCTURAL_MARKUP_CATEGORIES.support).toContain('evidence');
      expect(STRUCTURAL_MARKUP_CATEGORIES.support).toContain('statistic');
      expect(STRUCTURAL_MARKUP_CATEGORIES.support).toContain('quote');
      expect(STRUCTURAL_MARKUP_CATEGORIES.support).toContain('anecdote');
    });

    it('should cover all markup IDs across categories', () => {
      const allCategoryIds = [
        ...STRUCTURAL_MARKUP_CATEGORIES.assertions,
        ...STRUCTURAL_MARKUP_CATEGORIES.support,
      ];
      const allMarkupIds = STRUCTURAL_MARKUPS.map(m => m.id);
      for (const id of allMarkupIds) {
        expect(allCategoryIds).toContain(id);
      }
    });
  });

  describe('helper functions', () => {
    it('getStructuralMarkupById should return markup for valid ID', () => {
      const result = getStructuralMarkupById('claim');
      expect(result).toBeDefined();
      expect(result!.id).toBe('claim');
      expect(result!.name).toBe('Claim');
    });

    it('getStructuralMarkupById should return undefined for invalid ID', () => {
      const result = getStructuralMarkupById('nonexistent');
      expect(result).toBeUndefined();
    });

    it('getStructuralMarkupsByIds should return matching markups', () => {
      const result = getStructuralMarkupsByIds(['claim', 'evidence']);
      expect(result).toHaveLength(2);
      expect(result.map(m => m.id)).toEqual(expect.arrayContaining(['claim', 'evidence']));
    });

    it('getStructuralMarkupsByIds should return empty array for no matches', () => {
      const result = getStructuralMarkupsByIds(['nonexistent']);
      expect(result).toHaveLength(0);
    });

    it('getCategoryLabel should return correct labels', () => {
      expect(getCategoryLabel('assertions')).toBe('Assertions');
      expect(getCategoryLabel('support')).toBe('Supporting Evidence');
    });
  });
});
