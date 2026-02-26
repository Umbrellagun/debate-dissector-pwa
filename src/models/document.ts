import { Descendant } from 'slate';
import { Annotation } from './annotation';

export interface DebateDocument {
  id: string;
  title: string;
  content: Descendant[];
  annotations: Record<string, Annotation>;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

export interface DocumentListItem {
  id: string;
  title: string;
  preview: string;
  createdAt: number;
  updatedAt: number;
  annotationCount: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  autoSave: boolean;
  autoSaveInterval: number;
  showFallacyPanel: boolean;
  lastEditedDocumentId?: string;
  // UI state persistence
  fallaciesExpanded: boolean;
  rhetoricExpanded: boolean;
  annotationHintDismissed: boolean;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  // Individual category dropdowns (stored as arrays of expanded category IDs)
  expandedFallacyCategories: string[];
  expandedRhetoricCategories: string[];
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'system',
  fontSize: 'medium',
  autoSave: true,
  autoSaveInterval: 30000,
  showFallacyPanel: true,
  lastEditedDocumentId: undefined,
  // UI state defaults
  fallaciesExpanded: true,
  rhetoricExpanded: true,
  annotationHintDismissed: false,
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  expandedFallacyCategories: ['informal', 'red-herring'],
  expandedRhetoricCategories: ['ethos', 'pathos'],
};

export interface DocumentVersion {
  id: string;
  documentId: string;
  title: string;
  content: Descendant[];
  annotations: Record<string, Annotation>;
  timestamp: number;
  label?: string;
}
