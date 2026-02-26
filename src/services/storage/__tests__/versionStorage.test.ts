import { 
  createVersion, 
  getVersions, 
  getVersion, 
  deleteVersion,
  deleteAllVersions,
  updateVersionLabel,
  generateVersionId
} from '../versionStorage';
import { createDocument } from '../documentStorage';
import { closeDB, getDB } from '../db';

// Helper to clear all data from the database
async function clearDatabase() {
  const db = await getDB();
  const tx = db.transaction(['documents', 'syncQueue', 'versions'], 'readwrite');
  await tx.objectStore('documents').clear();
  await tx.objectStore('syncQueue').clear();
  await tx.objectStore('versions').clear();
  await tx.done;
}

describe('Version Storage', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDB();
  });

  describe('generateVersionId', () => {
    it('should generate a string starting with "ver_"', () => {
      const id = generateVersionId();
      expect(id).toMatch(/^ver_/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateVersionId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('createVersion', () => {
    it('should create a version snapshot of a document', async () => {
      const doc = await createDocument('Test Document');
      const version = await createVersion(doc);
      
      expect(version).toBeDefined();
      expect(version.id).toMatch(/^ver_/);
      expect(version.documentId).toBe(doc.id);
      expect(version.title).toBe(doc.title);
      expect(version.timestamp).toBeDefined();
    });

    it('should create a deep copy of content', async () => {
      const doc = await createDocument('Test');
      const version = await createVersion(doc);
      
      // Content should be a separate copy
      expect(version.content).toEqual(doc.content);
      expect(version.content).not.toBe(doc.content);
    });

    it('should allow setting a label', async () => {
      const doc = await createDocument('Test');
      const version = await createVersion(doc, 'Important checkpoint');
      
      expect(version.label).toBe('Important checkpoint');
    });
  });

  describe('getVersions', () => {
    it('should return empty array for document with no versions', async () => {
      const versions = await getVersions('non-existent-doc');
      
      expect(versions).toEqual([]);
    });

    it('should return all versions for a document', async () => {
      const doc = await createDocument('Test');
      await createVersion(doc);
      await createVersion(doc);
      await createVersion(doc);
      
      const versions = await getVersions(doc.id);
      
      expect(versions.length).toBe(3);
    });

    it('should return versions sorted by timestamp descending', async () => {
      const doc = await createDocument('Test');
      await createVersion(doc, 'First');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await createVersion(doc, 'Second');
      await new Promise(resolve => setTimeout(resolve, 10));
      await createVersion(doc, 'Third');
      
      const versions = await getVersions(doc.id);
      
      expect(versions[0].label).toBe('Third');
      expect(versions[2].label).toBe('First');
    });
  });

  describe('getVersion', () => {
    it('should retrieve a specific version by ID', async () => {
      const doc = await createDocument('Test');
      const created = await createVersion(doc, 'My Version');
      
      const retrieved = await getVersion(created.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.label).toBe('My Version');
    });

    it('should return undefined for non-existent version', async () => {
      const retrieved = await getVersion('non-existent-id');
      
      expect(retrieved).toBeUndefined();
    });
  });

  describe('deleteVersion', () => {
    it('should delete an existing version', async () => {
      const doc = await createDocument('Test');
      const version = await createVersion(doc);
      
      const deleted = await deleteVersion(version.id);
      
      expect(deleted).toBe(true);
      
      const retrieved = await getVersion(version.id);
      expect(retrieved).toBeUndefined();
    });

    it('should return false for non-existent version', async () => {
      const deleted = await deleteVersion('non-existent-id');
      
      expect(deleted).toBe(false);
    });
  });

  describe('deleteAllVersions', () => {
    it('should delete all versions for a document', async () => {
      const doc = await createDocument('Test');
      await createVersion(doc);
      await createVersion(doc);
      await createVersion(doc);
      
      await deleteAllVersions(doc.id);
      
      const versions = await getVersions(doc.id);
      expect(versions.length).toBe(0);
    });

    it('should not affect versions of other documents', async () => {
      const doc1 = await createDocument('Doc 1');
      const doc2 = await createDocument('Doc 2');
      await createVersion(doc1);
      await createVersion(doc2);
      
      await deleteAllVersions(doc1.id);
      
      const doc1Versions = await getVersions(doc1.id);
      const doc2Versions = await getVersions(doc2.id);
      
      expect(doc1Versions.length).toBe(0);
      expect(doc2Versions.length).toBe(1);
    });
  });

  describe('updateVersionLabel', () => {
    it('should update the label of an existing version', async () => {
      const doc = await createDocument('Test');
      const version = await createVersion(doc, 'Original Label');
      
      const updated = await updateVersionLabel(version.id, 'New Label');
      
      expect(updated).toBeDefined();
      expect(updated?.label).toBe('New Label');
    });

    it('should return undefined for non-existent version', async () => {
      const updated = await updateVersionLabel('non-existent-id', 'Label');
      
      expect(updated).toBeUndefined();
    });

    it('should persist the updated label', async () => {
      const doc = await createDocument('Test');
      const version = await createVersion(doc);
      
      await updateVersionLabel(version.id, 'Persisted Label');
      
      const retrieved = await getVersion(version.id);
      expect(retrieved?.label).toBe('Persisted Label');
    });
  });
});
