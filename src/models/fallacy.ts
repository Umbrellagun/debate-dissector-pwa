export type FallacyCategory =
  | 'formal'
  | 'informal'
  | 'red-herring'
  | 'propositional'
  | 'quantification'
  | 'syllogistic'
  | 'faulty-generalization'
  | 'conditional';

export interface Fallacy {
  id: string;
  name: string;
  description: string;
  category: FallacyCategory;
  color: string;
  examples?: string[];
}

export interface FallacyCategoryInfo {
  id: FallacyCategory;
  name: string;
  description: string;
  fallacies: Fallacy[];
}

export const FALLACY_CATEGORY_NAMES: Record<FallacyCategory, string> = {
  formal: 'Formal Fallacies',
  informal: 'Informal Fallacies',
  'red-herring': 'Red Herring Fallacies',
  propositional: 'Propositional Fallacies',
  quantification: 'Quantification Fallacies',
  syllogistic: 'Formal Syllogistic Fallacies',
  'faulty-generalization': 'Faulty Generalizations',
  conditional: 'Conditional or Questionable Fallacies',
};
