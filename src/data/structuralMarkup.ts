// Structural Markup Types for Claim & Evidence Analysis

export type StructuralMarkupType =
  | 'claim'
  | 'evidence'
  | 'unsupported'
  | 'statistic'
  | 'quote'
  | 'anecdote'
  | 'unaddressed';

export type VerificationStatus = 'unverified' | 'verified' | 'disputed';

export interface StructuralMarkup {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string; // Icon identifier for UI
  shortcut?: string; // Optional keyboard shortcut
}

export const STRUCTURAL_MARKUPS: StructuralMarkup[] = [
  {
    id: 'claim',
    name: 'Claim',
    description: 'A statement or assertion being made that may require evidence.',
    color: '#8B5CF6', // violet
    icon: 'claim',
    shortcut: 'C',
  },
  {
    id: 'evidence',
    name: 'Evidence',
    description: 'Supporting data, facts, or citations that back up a claim.',
    color: '#10B981', // green
    icon: 'evidence',
    shortcut: 'E',
  },
  {
    id: 'unsupported',
    name: 'Unsupported Claim',
    description: 'Opinion or claim stated as fact without any backing evidence.',
    color: '#EF4444', // red
    icon: 'unsupported',
    shortcut: 'U',
  },
  {
    id: 'statistic',
    name: 'Statistic',
    description: 'Numerical data or percentage that should be verifiable.',
    color: '#3B82F6', // blue
    icon: 'statistic',
    shortcut: 'T',
  },
  {
    id: 'quote',
    name: 'Quote',
    description: 'Direct quotation from a source or person.',
    color: '#06B6D4', // cyan
    icon: 'quote',
    shortcut: 'Q',
  },
  {
    id: 'anecdote',
    name: 'Anecdote',
    description: 'Personal story or example used as supporting evidence.',
    color: '#EC4899', // pink
    icon: 'anecdote',
    shortcut: 'A',
  },
  {
    id: 'unaddressed',
    name: 'Unaddressed',
    description: 'A point or argument that the other speaker ignores or fails to respond to.',
    color: '#F59E0B', // amber
    icon: 'unaddressed',
    shortcut: 'D',
  },
];

// Helper functions
export const getStructuralMarkupById = (id: string): StructuralMarkup | undefined =>
  STRUCTURAL_MARKUPS.find(m => m.id === id);

export const getStructuralMarkupsByIds = (ids: string[]): StructuralMarkup[] =>
  STRUCTURAL_MARKUPS.filter(m => ids.includes(m.id));

// Category groupings for UI organization
export const STRUCTURAL_MARKUP_CATEGORIES = {
  assertions: ['claim', 'unsupported', 'unaddressed'],
  support: ['evidence', 'statistic', 'quote', 'anecdote'],
};

export const getCategoryLabel = (category: keyof typeof STRUCTURAL_MARKUP_CATEGORIES): string => {
  const labels: Record<string, string> = {
    assertions: 'Assertions',
    support: 'Supporting Evidence',
  };
  return labels[category] || category;
};
