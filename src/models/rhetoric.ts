export type RhetoricCategory =
  | 'ethos'
  | 'pathos'
  | 'logos'
  | 'kairos';

export interface Rhetoric {
  id: string;
  name: string;
  description: string;
  category: RhetoricCategory;
  color: string;
  examples?: string[];
}

export interface RhetoricCategoryInfo {
  id: RhetoricCategory;
  name: string;
  description: string;
  techniques: Rhetoric[];
}

export const RHETORIC_CATEGORY_NAMES: Record<RhetoricCategory, string> = {
  ethos: 'Ethos (Credibility)',
  pathos: 'Pathos (Emotional)',
  logos: 'Logos (Logical)',
  kairos: 'Kairos (Timing)',
};

export const RHETORIC_CATEGORY_DESCRIPTIONS: Record<RhetoricCategory, string> = {
  ethos: 'Appeals to authority, character, or trustworthiness',
  pathos: 'Appeals to emotions, values, or desires',
  logos: 'Appeals to logic, reason, and evidence',
  kairos: 'Appeals to timeliness and appropriateness',
};
