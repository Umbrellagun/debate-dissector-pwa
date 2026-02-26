import { getDB } from './db';
import { DebateDocument, DocumentListItem } from '../../models';
import { Descendant } from 'slate';
import { createVersion } from './versionStorage';

/**
 * Generate a unique ID for documents
 */
export function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new document
 */
export async function createDocument(
  title: string = 'Untitled Debate',
  content: Descendant[] = [{ type: 'paragraph', children: [{ text: '' }] }]
): Promise<DebateDocument> {
  const db = await getDB();
  const now = Date.now();

  const document: DebateDocument = {
    id: generateDocumentId(),
    title,
    content,
    annotations: {},
    createdAt: now,
    updatedAt: now,
  };

  await db.put('documents', document);

  // Add to sync queue for future remote sync
  await db.put('syncQueue', {
    id: `sync_${Date.now()}`,
    documentId: document.id,
    action: 'create',
    timestamp: now,
    synced: false,
  });

  return document;
}

/**
 * Get a document by ID
 */
export async function getDocument(id: string): Promise<DebateDocument | undefined> {
  const db = await getDB();
  return db.get('documents', id);
}

/**
 * Update an existing document
 */
export async function updateDocument(
  id: string,
  updates: Partial<Omit<DebateDocument, 'id' | 'createdAt'>>
): Promise<DebateDocument | undefined> {
  const db = await getDB();
  const existing = await db.get('documents', id);

  if (!existing) {
    return undefined;
  }

  const updated: DebateDocument = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  await db.put('documents', updated);

  // Add to sync queue
  await db.put('syncQueue', {
    id: `sync_${Date.now()}`,
    documentId: id,
    action: 'update',
    timestamp: Date.now(),
    synced: false,
  });

  return updated;
}

/**
 * Delete a document
 */
export async function deleteDocument(id: string): Promise<boolean> {
  const db = await getDB();
  const existing = await db.get('documents', id);

  if (!existing) {
    return false;
  }

  await db.delete('documents', id);

  // Add to sync queue
  await db.put('syncQueue', {
    id: `sync_${Date.now()}`,
    documentId: id,
    action: 'delete',
    timestamp: Date.now(),
    synced: false,
  });

  return true;
}

/**
 * Get all documents as list items (for document list view)
 */
export async function listDocuments(): Promise<DocumentListItem[]> {
  const db = await getDB();
  const documents = await db.getAllFromIndex('documents', 'by-updated');

  return documents.reverse().map((doc) => ({
    id: doc.id,
    title: doc.title,
    preview: extractPreview(doc.content),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    annotationCount: Object.keys(doc.annotations).length,
  }));
}

/**
 * Extract a text preview from Slate content
 */
function extractPreview(content: Descendant[], maxLength: number = 100): string {
  let text = '';

  const extractText = (nodes: Descendant[]): void => {
    for (const node of nodes) {
      if (text.length >= maxLength) break;

      if ('text' in node) {
        text += node.text;
      } else if ('children' in node) {
        extractText(node.children as Descendant[]);
      }
    }
  };

  extractText(content);
  return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');
}

// Track last version time per document to avoid creating too many versions
const lastVersionTime: Record<string, number> = {};
const VERSION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Save a document (create or update)
 */
export async function saveDocument(doc: DebateDocument, forceVersion = false): Promise<DebateDocument> {
  const db = await getDB();
  const existing = await db.get('documents', doc.id);
  
  const document: DebateDocument = {
    ...doc,
    updatedAt: Date.now(),
  };
  
  // Create a version snapshot if enough time has passed or forced
  const lastTime = lastVersionTime[doc.id] || 0;
  const now = Date.now();
  if (existing && (forceVersion || now - lastTime >= VERSION_INTERVAL_MS)) {
    await createVersion(existing);
    lastVersionTime[doc.id] = now;
  }
  
  await db.put('documents', document);
  
  await db.put('syncQueue', {
    id: `sync_${Date.now()}`,
    documentId: doc.id,
    action: existing ? 'update' : 'create',
    timestamp: Date.now(),
    synced: false,
  });
  
  return document;
}

/**
 * Search documents by title or content
 */
export async function searchDocuments(query: string): Promise<DocumentListItem[]> {
  const allDocs = await listDocuments();
  const lowerQuery = query.toLowerCase();

  return allDocs.filter(
    (doc) =>
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.preview.toLowerCase().includes(lowerQuery)
  );
}
