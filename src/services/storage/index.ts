export { getDB, closeDB, initializePreferences } from './db';
export {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  listDocuments,
  searchDocuments,
  generateDocumentId,
  saveDocument,
} from './documentStorage';
export {
  getPreferences,
  updatePreferences,
  resetPreferences,
} from './preferencesStorage';
