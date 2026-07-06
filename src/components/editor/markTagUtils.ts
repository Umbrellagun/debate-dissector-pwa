import { FALLACIES } from '../../data/fallacies';
import { RHETORIC_TECHNIQUES } from '../../data/rhetoric';
import { getStructuralMarkupById } from '../../data/structuralMarkup';
import { FallacyMark, RhetoricMark, StructuralMark } from './types';

export type TagInfo = {
  id: string;
  label: string;
  color: string;
  category: string;
  type: 'fallacy' | 'rhetoric' | 'structural';
};

export function getFallacyInfo(mark: FallacyMark, customColors?: Record<string, string>): TagInfo {
  const fallacy = FALLACIES.find(f => f.id === mark.fallacyId);
  const color = customColors?.[mark.fallacyId] || fallacy?.color || mark.color;
  return {
    id: mark.fallacyId,
    label: fallacy?.name || mark.fallacyId,
    color,
    category: 'Fallacy',
    type: 'fallacy',
  };
}

export function getRhetoricInfo(
  mark: RhetoricMark,
  customColors?: Record<string, string>
): TagInfo {
  const rhetoric = RHETORIC_TECHNIQUES.find(r => r.id === mark.rhetoricId);
  const color = customColors?.[mark.rhetoricId] || rhetoric?.color || mark.color;
  return {
    id: mark.rhetoricId,
    label: rhetoric?.name || mark.rhetoricId,
    color,
    category: 'Rhetoric',
    type: 'rhetoric',
  };
}

export function getStructuralInfo(
  mark: StructuralMark,
  customColors?: Record<string, string>
): TagInfo {
  const markup = getStructuralMarkupById(mark.markupId);
  const color = customColors?.[mark.markupId] || markup?.color || mark.color;
  return {
    id: mark.markupId,
    label: markup?.name || mark.markupId,
    color,
    category: 'Structure',
    type: 'structural',
  };
}

export function isColorDark(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}
