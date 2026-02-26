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
export {
  createVersion,
  getVersions,
  getVersion,
  deleteVersion,
  deleteAllVersions,
  updateVersionLabel,
} from './versionStorage';
