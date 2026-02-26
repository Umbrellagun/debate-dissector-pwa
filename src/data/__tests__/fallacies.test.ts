import { FALLACIES } from '../fallacies';
import { FallacyCategory } from '../../models';

describe('FALLACIES data', () => {
  describe('data integrity', () => {
    it('should have fallacies defined', () => {
      expect(FALLACIES).toBeDefined();
      expect(Array.isArray(FALLACIES)).toBe(true);
      expect(FALLACIES.length).toBeGreaterThan(0);
    });

    it('should have unique IDs for all fallacies', () => {
      const ids = FALLACIES.map(f => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique names for all fallacies', () => {
      const names = FALLACIES.map(f => f.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have valid categories for all fallacies', () => {
      const validCategories: FallacyCategory[] = [
        'informal', 
        'formal', 
        'red-herring', 
        'propositional',
        'quantification',
        'syllogistic',
        'faulty-generalization',
        'conditional'
      ];
      
      for (const fallacy of FALLACIES) {
        expect(validCategories).toContain(fallacy.category);
      }
    });

    it('should have valid hex color codes for all fallacies', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      
      for (const fallacy of FALLACIES) {
        expect(fallacy.color).toMatch(hexColorRegex);
      }
    });

    it('should have non-empty descriptions for all fallacies', () => {
      for (const fallacy of FALLACIES) {
        expect(fallacy.description).toBeDefined();
        expect(fallacy.description.length).toBeGreaterThan(0);
      }
    });

    it('should have non-empty names for all fallacies', () => {
      for (const fallacy of FALLACIES) {
        expect(fallacy.name).toBeDefined();
        expect(fallacy.name.length).toBeGreaterThan(0);
      }
    });

    it('should have non-empty IDs for all fallacies', () => {
      for (const fallacy of FALLACIES) {
        expect(fallacy.id).toBeDefined();
        expect(fallacy.id.length).toBeGreaterThan(0);
      }
    });
  });

  describe('category distribution', () => {
    it('should have fallacies in multiple categories', () => {
      const categories = new Set(FALLACIES.map(f => f.category));
      expect(categories.size).toBeGreaterThan(1);
    });

    it('should have at least one informal fallacy', () => {
      const informal = FALLACIES.filter(f => f.category === 'informal');
      expect(informal.length).toBeGreaterThan(0);
    });
  });
});
