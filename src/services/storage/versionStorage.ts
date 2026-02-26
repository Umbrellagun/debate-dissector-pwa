import { getDB } from './db';
import { DocumentVersion, DebateDocument } from '../../models';

const MAX_VERSIONS_PER_DOCUMENT = 50;

/**
 * Generate a unique ID for versions
 */
export function generateVersionId(): string {
  return `ver_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a version snapshot of a document
 */
export async function createVersion(
  document: DebateDocument,
  label?: string
): Promise<DocumentVersion> {
  const db = await getDB();
  
  const version: DocumentVersion = {
    id: generateVersionId(),
    documentId: document.id,
    title: document.title,
    content: JSON.parse(JSON.stringify(document.content)),
    annotations: JSON.parse(JSON.stringify(document.annotations)),
    timestamp: Date.now(),
    label,
  };
  
  await db.put('versions', version);
  
  // Cleanup old versions if we exceed the limit
  await cleanupOldVersions(document.id);
  
  return version;
}

/**
 * Get all versions for a document, sorted by timestamp descending
 */
export async function getVersions(documentId: string): Promise<DocumentVersion[]> {
  const db = await getDB();
  const versions = await db.getAllFromIndex('versions', 'by-document', documentId);
  return versions.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get a specific version by ID
 */
export async function getVersion(versionId: string): Promise<DocumentVersion | undefined> {
  const db = await getDB();
  return db.get('versions', versionId);
}

/**
 * Delete a specific version
 */
export async function deleteVersion(versionId: string): Promise<boolean> {
  const db = await getDB();
  const existing = await db.get('versions', versionId);
  
  if (!existing) {
    return false;
  }
  
  await db.delete('versions', versionId);
  return true;
}

/**
 * Delete all versions for a document
 */
export async function deleteAllVersions(documentId: string): Promise<void> {
  const db = await getDB();
  const versions = await db.getAllFromIndex('versions', 'by-document', documentId);
  
  for (const version of versions) {
    await db.delete('versions', version.id);
  }
}

/**
 * Cleanup old versions to keep only the most recent ones
 */
async function cleanupOldVersions(documentId: string): Promise<void> {
  const db = await getDB();
  const versions = await db.getAllFromIndex('versions', 'by-document', documentId);
  
  if (versions.length <= MAX_VERSIONS_PER_DOCUMENT) {
    return;
  }
  
  // Sort by timestamp descending
  versions.sort((a, b) => b.timestamp - a.timestamp);
  
  // Delete oldest versions
  const toDelete = versions.slice(MAX_VERSIONS_PER_DOCUMENT);
  for (const version of toDelete) {
    await db.delete('versions', version.id);
  }
}

/**
 * Update version label
 */
export async function updateVersionLabel(
  versionId: string,
  label: string
): Promise<DocumentVersion | undefined> {
  const db = await getDB();
  const version = await db.get('versions', versionId);
  
  if (!version) {
    return undefined;
  }
  
  const updated: DocumentVersion = {
    ...version,
    label,
  };
  
  await db.put('versions', updated);
  return updated;
}
