import { Descendant } from 'slate';
import { Annotation } from './annotation';
import { Comment } from './comment';

// Speaker/Participant data model
export interface Speaker {
  id: string;
  name: string;
  color: string;
  shortName?: string; // Optional abbreviated name (e.g., "JB" for "Joe Biden")
}

// Default speaker colors for auto-assignment
export const DEFAULT_SPEAKER_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

export interface DebateDocument {
  id: string;
  title: string;
  content: Descendant[];
  annotations: Record<string, Annotation>;
  comments?: Record<string, Comment>; // Comments linked to text ranges
  speakers?: Speaker[]; // List of speakers in this document
  hiddenAnnotationIds?: { fallacyIds: string[]; rhetoricIds: string[]; structuralIds: string[] };
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
  expandedStructuralCategories: string[];
  structuralExpanded: boolean;
  // Pinned annotations for quick access in toolbar
  pinnedFallacies: string[];
  pinnedRhetoric: string[];
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
  leftSidebarOpen: false,
  rightSidebarOpen: true,
  expandedFallacyCategories: ['informal', 'red-herring'],
  expandedRhetoricCategories: ['ethos', 'pathos'],
  expandedStructuralCategories: ['assertions', 'support'],
  structuralExpanded: true,
  pinnedFallacies: [],
  pinnedRhetoric: [],
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
