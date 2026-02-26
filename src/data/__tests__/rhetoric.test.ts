import { RHETORIC_TECHNIQUES } from '../rhetoric';
import { RhetoricCategory } from '../../models';

describe('RHETORIC_TECHNIQUES data', () => {
  describe('data integrity', () => {
    it('should have rhetoric techniques defined', () => {
      expect(RHETORIC_TECHNIQUES).toBeDefined();
      expect(Array.isArray(RHETORIC_TECHNIQUES)).toBe(true);
      expect(RHETORIC_TECHNIQUES.length).toBeGreaterThan(0);
    });

    it('should have unique IDs for all rhetoric techniques', () => {
      const ids = RHETORIC_TECHNIQUES.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique names for all rhetoric techniques', () => {
      const names = RHETORIC_TECHNIQUES.map(r => r.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have valid categories for all rhetoric techniques', () => {
      const validCategories: RhetoricCategory[] = ['ethos', 'pathos', 'logos', 'kairos'];
      
      for (const rhetoric of RHETORIC_TECHNIQUES) {
        expect(validCategories).toContain(rhetoric.category);
      }
    });

    it('should have valid hex color codes for all rhetoric techniques', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      
      for (const rhetoric of RHETORIC_TECHNIQUES) {
        expect(rhetoric.color).toMatch(hexColorRegex);
      }
    });

    it('should have non-empty descriptions for all rhetoric techniques', () => {
      for (const rhetoric of RHETORIC_TECHNIQUES) {
        expect(rhetoric.description).toBeDefined();
        expect(rhetoric.description.length).toBeGreaterThan(0);
      }
    });

    it('should have non-empty names for all rhetoric techniques', () => {
      for (const rhetoric of RHETORIC_TECHNIQUES) {
        expect(rhetoric.name).toBeDefined();
        expect(rhetoric.name.length).toBeGreaterThan(0);
      }
    });

    it('should have non-empty IDs for all rhetoric techniques', () => {
      for (const rhetoric of RHETORIC_TECHNIQUES) {
        expect(rhetoric.id).toBeDefined();
        expect(rhetoric.id.length).toBeGreaterThan(0);
      }
    });
  });

  describe('category distribution', () => {
    it('should have rhetoric techniques in multiple categories', () => {
      const categories = new Set(RHETORIC_TECHNIQUES.map(r => r.category));
      expect(categories.size).toBeGreaterThan(1);
    });

    it('should have at least one ethos technique', () => {
      const ethos = RHETORIC_TECHNIQUES.filter(r => r.category === 'ethos');
      expect(ethos.length).toBeGreaterThan(0);
    });

    it('should have at least one pathos technique', () => {
      const pathos = RHETORIC_TECHNIQUES.filter(r => r.category === 'pathos');
      expect(pathos.length).toBeGreaterThan(0);
    });

    it('should have at least one logos technique', () => {
      const logos = RHETORIC_TECHNIQUES.filter(r => r.category === 'logos');
      expect(logos.length).toBeGreaterThan(0);
    });
  });
});
