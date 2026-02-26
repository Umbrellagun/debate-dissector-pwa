import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Descendant } from 'slate';
import { DebateDocument, DocumentListItem, UserPreferences, DEFAULT_USER_PREFERENCES } from '../models';
import {
  listDocuments,
  getDocument,
  saveDocument as saveDoc,
  deleteDocument as deleteDoc,
  generateDocumentId,
  getPreferences,
  updatePreferences as updatePrefs,
} from '../services/storage';

// Count total annotations (fallacy + rhetoric marks) in content
const countAnnotationsInContent = (content: Descendant[]): number => {
  let count = 0;
  
  const traverse = (nodes: Descendant[]) => {
    for (const node of nodes) {
      if ('text' in node) {
        const textNode = node as { fallacyMarks?: unknown[]; rhetoricMarks?: unknown[] };
        if (textNode.fallacyMarks) {
          count += textNode.fallacyMarks.length;
        }
        if (textNode.rhetoricMarks) {
          count += textNode.rhetoricMarks.length;
        }
      }
      if ('children' in node && Array.isArray((node as { children: Descendant[] }).children)) {
        traverse((node as { children: Descendant[] }).children);
      }
    }
  };
  
  traverse(content);
  return count;
};

interface AppState {
  documents: DocumentListItem[];
  currentDocument: DebateDocument | null;
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_DOCUMENTS'; payload: DocumentListItem[] }
  | { type: 'SET_CURRENT_DOCUMENT'; payload: DebateDocument | null }
  | { type: 'SET_PREFERENCES'; payload: UserPreferences }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_DOCUMENT'; payload: DocumentListItem }
  | { type: 'UPDATE_DOCUMENT'; payload: DocumentListItem }
  | { type: 'REMOVE_DOCUMENT'; payload: string };

const initialState: AppState = {
  documents: [],
  currentDocument: null,
  preferences: DEFAULT_USER_PREFERENCES,
  isLoading: true,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload };
    case 'SET_CURRENT_DOCUMENT':
      return { ...state, currentDocument: action.payload };
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_DOCUMENT':
      return { ...state, documents: [action.payload, ...state.documents] };
    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map((doc) =>
          doc.id === action.payload.id ? action.payload : doc
        ),
      };
    case 'REMOVE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter((doc) => doc.id !== action.payload),
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  loadDocuments: () => Promise<DocumentListItem[]>;
  loadDocument: (id: string) => Promise<DebateDocument | null>;
  createDocument: (title: string, content?: Descendant[]) => Promise<DebateDocument>;
  saveDocument: (doc: DebateDocument) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        const [documents, preferences] = await Promise.all([
          listDocuments(),
          getPreferences(),
        ]);
        dispatch({ type: 'SET_DOCUMENTS', payload: documents });
        dispatch({ type: 'SET_PREFERENCES', payload: preferences });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    init();
  }, []);

  const loadDocuments = async (): Promise<DocumentListItem[]> => {
    const docs = await listDocuments();
    dispatch({ type: 'SET_DOCUMENTS', payload: docs });
    return docs;
  };

  const loadDocument = async (id: string): Promise<DebateDocument | null> => {
    const doc = await getDocument(id);
    if (doc) {
      dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: doc });
      return doc;
    }
    return null;
  };

  const createDocument = async (
    title: string,
    content: Descendant[] = [{ type: 'paragraph', children: [{ text: '' }] }]
  ): Promise<DebateDocument> => {
    const now = Date.now();
    const doc: DebateDocument = {
      id: generateDocumentId(),
      title,
      content,
      annotations: {},
      createdAt: now,
      updatedAt: now,
    };
    await saveDoc(doc);
    dispatch({
      type: 'ADD_DOCUMENT',
      payload: {
        id: doc.id,
        title: doc.title,
        preview: '',
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        annotationCount: 0,
      },
    });
    dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: doc });
    return doc;
  };

  const saveDocument = async (doc: DebateDocument) => {
    await saveDoc(doc);
    dispatch({
      type: 'UPDATE_DOCUMENT',
      payload: {
        id: doc.id,
        title: doc.title,
        preview: '',
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        annotationCount: countAnnotationsInContent(doc.content),
      },
    });
  };

  const deleteDocument = async (id: string) => {
    await deleteDoc(id);
    dispatch({ type: 'REMOVE_DOCUMENT', payload: id });
    if (state.currentDocument?.id === id) {
      dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: null });
    }
  };

  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    const updated = await updatePrefs(prefs);
    dispatch({ type: 'SET_PREFERENCES', payload: updated });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        loadDocuments,
        loadDocument,
        createDocument,
        saveDocument,
        deleteDocument,
        updatePreferences,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
