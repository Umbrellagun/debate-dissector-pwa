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
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'system',
  fontSize: 'medium',
  autoSave: true,
  autoSaveInterval: 30000,
  showFallacyPanel: true,
  lastEditedDocumentId: undefined,
};
