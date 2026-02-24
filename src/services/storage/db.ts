import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DebateDocument, UserPreferences, DEFAULT_USER_PREFERENCES } from '../../models';

const DB_NAME = 'debate-dissector';
const DB_VERSION = 1;

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
