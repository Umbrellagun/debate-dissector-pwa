export { getDB, closeDB, initializePreferences } from './db';
export {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  listDocuments,
  searchDocuments,
  generateDocumentId,
} from './documentStorage';
export {
  getPreferences,
  updatePreferences,
  resetPreferences,
} from './preferencesStorage';
