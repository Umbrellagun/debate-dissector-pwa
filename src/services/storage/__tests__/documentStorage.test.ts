import { generateDocumentId } from '../documentStorage';

describe('documentStorage', () => {
  describe('generateDocumentId', () => {
    it('should generate a 15-character id', () => {
      expect(generateDocumentId()).toHaveLength(15);
    });

    it('should only use PocketBase-compatible characters ([a-z0-9])', () => {
      for (let i = 0; i < 100; i++) {
        expect(generateDocumentId()).toMatch(/^[a-z0-9]{15}$/);
      }
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateDocumentId());
      }
      expect(ids.size).toBe(1000);
    });
  });
});
