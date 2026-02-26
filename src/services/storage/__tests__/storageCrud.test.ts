import { 
  createDocument, 
  getDocument, 
  updateDocument, 
  deleteDocument, 
  listDocuments,
  searchDocuments,
  saveDocument
} from '../documentStorage';
import { 
  getPreferences, 
  updatePreferences, 
  resetPreferences 
} from '../preferencesStorage';
import { closeDB, getDB } from '../db';
import { DEFAULT_USER_PREFERENCES } from '../../../models';

// Helper to clear all data from the database
async function clearDatabase() {
  const db = await getDB();
  const tx = db.transaction(['documents', 'syncQueue', 'preferences'], 'readwrite');
  await tx.objectStore('documents').clear();
  await tx.objectStore('syncQueue').clear();
  await tx.objectStore('preferences').clear();
  await tx.done;
}

describe('Document Storage CRUD', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDB();
  });

  describe('createDocument', () => {
    it('should create a document with default values', async () => {
      const doc = await createDocument();
      
      expect(doc).toBeDefined();
      expect(doc.id).toMatch(/^doc_/);
      expect(doc.title).toBe('Untitled Debate');
      expect(doc.content).toEqual([{ type: 'paragraph', children: [{ text: '' }] }]);
      expect(doc.annotations).toEqual({});
      expect(doc.createdAt).toBeDefined();
      expect(doc.updatedAt).toBeDefined();
    });

    it('should create a document with custom title', async () => {
      const doc = await createDocument('My Custom Debate');
      
      expect(doc.title).toBe('My Custom Debate');
    });

    it('should create a document with custom content', async () => {
      const customContent = [{ type: 'paragraph', children: [{ text: 'Hello world' }] }];
      const doc = await createDocument('Test', customContent as any);
      
      expect(doc.content).toEqual(customContent);
    });
  });

  describe('getDocument', () => {
    it('should retrieve a created document', async () => {
      const created = await createDocument('Test Doc');
      const retrieved = await getDocument(created.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.title).toBe('Test Doc');
    });

    it('should return undefined for non-existent document', async () => {
      const retrieved = await getDocument('non-existent-id');
      
      expect(retrieved).toBeUndefined();
    });
  });

  describe('updateDocument', () => {
    it('should update document title', async () => {
      const created = await createDocument('Original Title');
      const updated = await updateDocument(created.id, { title: 'New Title' });
      
      expect(updated).toBeDefined();
      expect(updated?.title).toBe('New Title');
      expect(updated?.updatedAt).toBeGreaterThanOrEqual(created.updatedAt);
    });

    it('should return undefined when updating non-existent document', async () => {
      const updated = await updateDocument('non-existent-id', { title: 'New Title' });
      
      expect(updated).toBeUndefined();
    });

    it('should preserve other fields when updating', async () => {
      const created = await createDocument('Test Doc');
      const updated = await updateDocument(created.id, { title: 'Updated' });
      
      expect(updated?.id).toBe(created.id);
      expect(updated?.createdAt).toBe(created.createdAt);
      expect(updated?.content).toEqual(created.content);
    });
  });

  describe('deleteDocument', () => {
    it('should delete an existing document', async () => {
      const created = await createDocument('To Delete');
      const deleted = await deleteDocument(created.id);
      
      expect(deleted).toBe(true);
      
      const retrieved = await getDocument(created.id);
      expect(retrieved).toBeUndefined();
    });

    it('should return false when deleting non-existent document', async () => {
      const deleted = await deleteDocument('non-existent-id');
      
      expect(deleted).toBe(false);
    });
  });

  describe('listDocuments', () => {
    it('should return empty array when no documents exist', async () => {
      const docs = await listDocuments();
      
      expect(docs).toEqual([]);
    });

    it('should return all documents as list items', async () => {
      await createDocument('Doc 1');
      await createDocument('Doc 2');
      
      const docs = await listDocuments();
      
      expect(docs.length).toBe(2);
      expect(docs[0]).toHaveProperty('id');
      expect(docs[0]).toHaveProperty('title');
      expect(docs[0]).toHaveProperty('preview');
      expect(docs[0]).toHaveProperty('annotationCount');
    });
  });

  describe('searchDocuments', () => {
    it('should find documents by title', async () => {
      await createDocument('Apple Debate');
      await createDocument('Orange Debate');
      
      const results = await searchDocuments('Apple');
      
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Apple Debate');
    });

    it('should be case insensitive', async () => {
      await createDocument('UPPERCASE Title');
      
      const results = await searchDocuments('uppercase');
      
      expect(results.length).toBe(1);
    });

    it('should return empty array when no matches', async () => {
      await createDocument('Test Document');
      
      const results = await searchDocuments('nonexistent');
      
      expect(results).toEqual([]);
    });
  });

  describe('saveDocument', () => {
    it('should save a new document', async () => {
      const doc = await createDocument('Initial');
      doc.title = 'Modified';
      
      const saved = await saveDocument(doc);
      
      expect(saved.title).toBe('Modified');
      expect(saved.updatedAt).toBeGreaterThanOrEqual(doc.updatedAt);
    });
  });
});

describe('Preferences Storage', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('getPreferences', () => {
    it('should return default preferences when none exist', async () => {
      const prefs = await getPreferences();
      
      expect(prefs).toEqual(DEFAULT_USER_PREFERENCES);
    });
  });

  describe('updatePreferences', () => {
    it('should update specific preference fields', async () => {
      const updated = await updatePreferences({ theme: 'dark' });
      
      expect(updated.theme).toBe('dark');
      expect(updated.fontSize).toBe(DEFAULT_USER_PREFERENCES.fontSize);
    });

    it('should persist updated preferences', async () => {
      await updatePreferences({ fontSize: 'large' });
      const prefs = await getPreferences();
      
      expect(prefs.fontSize).toBe('large');
    });
  });

  describe('resetPreferences', () => {
    it('should reset to default preferences', async () => {
      await updatePreferences({ theme: 'dark', fontSize: 'large' });
      const reset = await resetPreferences();
      
      expect(reset).toEqual(DEFAULT_USER_PREFERENCES);
    });
  });
});
