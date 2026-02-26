import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DebateDocument, UserPreferences, DEFAULT_USER_PREFERENCES, DocumentVersion } from '../../models';

const DB_NAME = 'debate-dissector';
const DB_VERSION = 2;

interface DebateDissectorDB extends DBSchema {
  documents: {
    key: string;
    value: DebateDocument;
    indexes: {
      'by-updated': number;
      'by-created': number;
    };
  };
  preferences: {
    key: string;
    value: UserPreferences;
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      documentId: string;
      action: 'create' | 'update' | 'delete';
      timestamp: number;
      synced: boolean;
    };
  };
  versions: {
    key: string;
    value: DocumentVersion;
    indexes: {
      'by-document': string;
      'by-timestamp': number;
    };
  };
}

let dbInstance: IDBPDatabase<DebateDissectorDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<DebateDissectorDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<DebateDissectorDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Documents store
      if (!db.objectStoreNames.contains('documents')) {
        const documentStore = db.createObjectStore('documents', { keyPath: 'id' });
        documentStore.createIndex('by-updated', 'updatedAt');
        documentStore.createIndex('by-created', 'createdAt');
      }

      // User preferences store
      if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences');
      }

      // Sync queue for future remote sync capability
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }

      // Document versions store for version history
      if (!db.objectStoreNames.contains('versions')) {
        const versionStore = db.createObjectStore('versions', { keyPath: 'id' });
        versionStore.createIndex('by-document', 'documentId');
        versionStore.createIndex('by-timestamp', 'timestamp');
      }
    },
  });

  return dbInstance;
}

export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export async function initializePreferences(): Promise<UserPreferences> {
  const db = await getDB();
  const existing = await db.get('preferences', 'user');
  if (!existing) {
    await db.put('preferences', DEFAULT_USER_PREFERENCES, 'user');
    return DEFAULT_USER_PREFERENCES;
  }
  return existing;
}
