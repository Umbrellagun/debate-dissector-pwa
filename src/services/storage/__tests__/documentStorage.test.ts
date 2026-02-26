import { generateDocumentId } from '../documentStorage';

describe('documentStorage', () => {
  describe('generateDocumentId', () => {
    it('should generate a string starting with "doc_"', () => {
      const id = generateDocumentId();
      expect(id).toMatch(/^doc_/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateDocumentId());
      }
      expect(ids.size).toBe(100);
    });

    it('should include a timestamp component', () => {
      const before = Date.now();
      const id = generateDocumentId();
      const after = Date.now();

      // Extract timestamp from id (format: doc_TIMESTAMP_RANDOM)
      const parts = id.split('_');
      const timestamp = parseInt(parts[1], 10);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should include a random component', () => {
      const id = generateDocumentId();
      const parts = id.split('_');

      // Should have 3 parts: doc, timestamp, random
      expect(parts.length).toBe(3);
      expect(parts[2].length).toBeGreaterThan(0);
    });
  });
});
