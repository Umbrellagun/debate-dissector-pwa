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
  autoSave: boolean;
  autoSaveInterval: number;
  showFallacyPanel: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'system',
  autoSave: true,
  autoSaveInterval: 30000,
  showFallacyPanel: true,
};
