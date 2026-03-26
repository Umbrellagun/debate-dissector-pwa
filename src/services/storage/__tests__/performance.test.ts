/**
 * Performance Benchmark Tests
 *
 * Tests IndexedDB operations and large document handling to ensure
 * the app meets performance requirements:
 * - IndexedDB operations: <100ms for typical operations
 * - Large documents: 1000+ words, 50+ annotations
 */

import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  listDocuments,
} from '../documentStorage';
import { closeDB, getDB } from '../db';
import { DebateDocument } from '../../../models';

// Performance thresholds (in milliseconds)
const PERF_THRESHOLDS = {
  CREATE_DOCUMENT: 100,
  GET_DOCUMENT: 100,
  UPDATE_DOCUMENT: 100,
  DELETE_DOCUMENT: 100,
  LIST_DOCUMENTS: 200,
  SAVE_LARGE_DOCUMENT: 500,
  BATCH_CREATE: 1000, // 10 documents
};

// Helper to clear all data from the database
async function clearDatabase() {
  const db = await getDB();
  const tx = db.transaction(['documents', 'syncQueue', 'preferences'], 'readwrite');
  await tx.objectStore('documents').clear();
  await tx.objectStore('syncQueue').clear();
  await tx.objectStore('preferences').clear();
  await tx.done;
}

// Helper to measure execution time
async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

// Generate large document content (1000+ words)
function generateLargeContent(wordCount: number = 1000): any[] {
  const words = [
    'The',
    'argument',
    'presents',
    'a',
    'logical',
    'fallacy',
    'that',
    'undermines',
    'the',
    'validity',
    'of',
    'conclusion',
    'because',
    'it',
    'relies',
    'on',
    'premises',
    'which',
    'are',
    'not',
    'necessarily',
    'true',
    'or',
    'relevant',
    'to',
    'central',
    'claim',
    'being',
    'made',
    'by',
    'speaker',
    'in',
    'this',
    'debate',
    'context',
    'we',
    'must',
    'consider',
    'evidence',
    'carefully',
  ];

  const paragraphs: any[] = [];
  let currentWordCount = 0;

  while (currentWordCount < wordCount) {
    const paragraphWords: string[] = [];
    const paragraphLength = Math.floor(Math.random() * 50) + 30; // 30-80 words per paragraph

    for (let i = 0; i < paragraphLength && currentWordCount < wordCount; i++) {
      paragraphWords.push(words[Math.floor(Math.random() * words.length)]);
      currentWordCount++;
    }

    paragraphs.push({
      type: 'paragraph',
      children: [{ text: paragraphWords.join(' ') + '.' }],
    });
  }

  return paragraphs;
}

// Generate annotations (50+ annotations)
function generateAnnotations(count: number = 50): Record<string, any> {
  const fallacyTypes = [
    'ad-hominem',
    'straw-man',
    'false-dilemma',
    'slippery-slope',
    'appeal-to-authority',
    'hasty-generalization',
    'red-herring',
    'circular-reasoning',
    'bandwagon',
    'false-cause',
  ];

  const annotations: Record<string, any> = {};

  for (let i = 0; i < count; i++) {
    const id = `ann_${Date.now()}_${i}`;
    annotations[id] = {
      id,
      type: 'fallacy',
      fallacyType: fallacyTypes[Math.floor(Math.random() * fallacyTypes.length)],
      startOffset: i * 20,
      endOffset: i * 20 + 15,
      note: `Annotation note ${i}`,
      createdAt: Date.now(),
    };
  }

  return annotations;
}

describe('Performance Benchmarks', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDB();
  });

  describe('IndexedDB Operations (<100ms)', () => {
    it(`createDocument should complete within ${PERF_THRESHOLDS.CREATE_DOCUMENT}ms`, async () => {
      const { duration } = await measureTime(() => createDocument('Performance Test'));

      console.log(`createDocument: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERF_THRESHOLDS.CREATE_DOCUMENT);
    });

    it(`getDocument should complete within ${PERF_THRESHOLDS.GET_DOCUMENT}ms`, async () => {
      const doc = await createDocument('Performance Test');

      const { duration } = await measureTime(() => getDocument(doc.id));

      console.log(`getDocument: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERF_THRESHOLDS.GET_DOCUMENT);
    });

    it(`updateDocument should complete within ${PERF_THRESHOLDS.UPDATE_DOCUMENT}ms`, async () => {
      const doc = await createDocument('Performance Test');

      const { duration } = await measureTime(() =>
        updateDocument(doc.id, { title: 'Updated Title' })
      );

      console.log(`updateDocument: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERF_THRESHOLDS.UPDATE_DOCUMENT);
    });

    it(`deleteDocument should complete within ${PERF_THRESHOLDS.DELETE_DOCUMENT}ms`, async () => {
      const doc = await createDocument('Performance Test');

      const { duration } = await measureTime(() => deleteDocument(doc.id));

      console.log(`deleteDocument: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERF_THRESHOLDS.DELETE_DOCUMENT);
    });

    it(`listDocuments (10 docs) should complete within ${PERF_THRESHOLDS.LIST_DOCUMENTS}ms`, async () => {
      // Create 10 documents
      for (let i = 0; i < 10; i++) {
        await createDocument(`Document ${i}`);
      }

      const { duration } = await measureTime(() => listDocuments());

      console.log(`listDocuments (10 docs): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERF_THRESHOLDS.LIST_DOCUMENTS);
    });

    it(`batch create 10 documents should complete within ${PERF_THRESHOLDS.BATCH_CREATE}ms`, async () => {
      const { duration } = await measureTime(async () => {
        for (let i = 0; i < 10; i++) {
          await createDocument(`Batch Document ${i}`);
        }
      });

      console.log(`batch create (10 docs): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERF_THRESHOLDS.BATCH_CREATE);
    });
  });

  describe('Large Document Performance', () => {
    it('should handle document with 1000+ words', async () => {
      const largeContent = generateLargeContent(1200);
      const wordCount = largeContent.reduce(
        (sum, p) => sum + (p.children[0]?.text?.split(' ').length || 0),
        0
      );

      console.log(`Generated document with ~${wordCount} words`);

      const { result: doc, duration: createDuration } = await measureTime(() =>
        createDocument('Large Document Test', largeContent as any)
      );

      console.log(`Create large document: ${createDuration.toFixed(2)}ms`);
      expect(doc).toBeDefined();
      expect(createDuration).toBeLessThan(PERF_THRESHOLDS.SAVE_LARGE_DOCUMENT);

      // Test retrieval
      const { duration: getDuration } = await measureTime(() => getDocument(doc.id));
      console.log(`Get large document: ${getDuration.toFixed(2)}ms`);
      expect(getDuration).toBeLessThan(PERF_THRESHOLDS.SAVE_LARGE_DOCUMENT);
    });

    it('should handle document with 50+ annotations', async () => {
      const doc = await createDocument('Annotated Document Test');
      const annotations = generateAnnotations(60);

      console.log(`Generated ${Object.keys(annotations).length} annotations`);

      const { result: updated, duration } = await measureTime(() =>
        updateDocument(doc.id, { annotations })
      );

      console.log(`Update with 60 annotations: ${duration.toFixed(2)}ms`);
      expect(updated).toBeDefined();
      expect(Object.keys(updated!.annotations).length).toBe(60);
      expect(duration).toBeLessThan(PERF_THRESHOLDS.SAVE_LARGE_DOCUMENT);
    });

    it('should handle large document with many annotations', async () => {
      const largeContent = generateLargeContent(1500);
      const annotations = generateAnnotations(75);

      const { result: doc, duration: createDuration } = await measureTime(() =>
        createDocument('Full Test Document', largeContent as any)
      );

      const { duration: updateDuration } = await measureTime(() =>
        updateDocument(doc.id, { annotations })
      );

      const totalDuration = createDuration + updateDuration;
      console.log(`Large doc + 75 annotations: ${totalDuration.toFixed(2)}ms`);

      // Verify data integrity
      const retrieved = await getDocument(doc.id);
      expect(retrieved).toBeDefined();
      expect(Object.keys(retrieved!.annotations).length).toBe(75);
      expect(retrieved!.content.length).toBeGreaterThan(10);
    });
  });

  describe('Memory and Stress Tests', () => {
    it('should handle rapid successive operations', async () => {
      const operations = 50;
      const docs: DebateDocument[] = [];

      const { duration } = await measureTime(async () => {
        // Create
        for (let i = 0; i < operations; i++) {
          docs.push(await createDocument(`Rapid Test ${i}`));
        }

        // Update all
        for (const doc of docs) {
          await updateDocument(doc.id, { title: `Updated ${doc.id}` });
        }

        // Read all
        for (const doc of docs) {
          await getDocument(doc.id);
        }
      });

      const avgPerOperation = duration / (operations * 3);
      console.log(
        `${operations * 3} operations in ${duration.toFixed(2)}ms (avg: ${avgPerOperation.toFixed(2)}ms)`
      );

      // Average should still be reasonable
      expect(avgPerOperation).toBeLessThan(50);
    });

    it('should handle listing many documents efficiently', async () => {
      // Create 50 documents
      for (let i = 0; i < 50; i++) {
        await createDocument(`List Test ${i}`);
      }

      const { result: docs, duration } = await measureTime(() => listDocuments());

      console.log(`List 50 documents: ${duration.toFixed(2)}ms`);
      expect(docs.length).toBe(50);
      expect(duration).toBeLessThan(500); // Should still be fast
    });
  });
});
