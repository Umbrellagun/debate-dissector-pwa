import { useCallback, useMemo } from 'react';
import { useApp } from '../context';
import { FALLACIES } from '../data/fallacies';
import { RHETORIC_TECHNIQUES } from '../data/rhetoric';
import { STRUCTURAL_MARKUPS } from '../data/structuralMarkup';

/**
 * Hook that provides color resolution for annotations.
 * Returns the user's custom color if set, otherwise falls back to the default.
 */
export function useAnnotationColors() {
  const {
    state: { preferences },
    updatePreferences,
  } = useApp();

  const customColors = useMemo(() => preferences.customColors ?? {}, [preferences.customColors]);

  const getColor = useCallback(
    (annotationId: string, defaultColor: string): string => {
      return customColors[annotationId] || defaultColor;
    },
    [customColors]
  );

  const getFallacyColor = useCallback(
    (fallacyId: string): string | undefined => {
      const fallacy = FALLACIES.find(f => f.id === fallacyId);
      if (!fallacy) return undefined;
      return customColors[fallacyId] || fallacy.color;
    },
    [customColors]
  );

  const getRhetoricColor = useCallback(
    (rhetoricId: string): string | undefined => {
      const rhetoric = RHETORIC_TECHNIQUES.find(r => r.id === rhetoricId);
      if (!rhetoric) return undefined;
      return customColors[rhetoricId] || rhetoric.color;
    },
    [customColors]
  );

  const getStructuralColor = useCallback(
    (markupId: string): string | undefined => {
      const markup = STRUCTURAL_MARKUPS.find(m => m.id === markupId);
      if (!markup) return undefined;
      return customColors[markupId] || markup.color;
    },
    [customColors]
  );

  const setCustomColor = useCallback(
    (annotationId: string, color: string) => {
      updatePreferences({
        customColors: { ...customColors, [annotationId]: color },
      });
    },
    [customColors, updatePreferences]
  );

  const resetColor = useCallback(
    (annotationId: string) => {
      const { [annotationId]: _, ...rest } = customColors;
      updatePreferences({ customColors: rest });
    },
    [customColors, updatePreferences]
  );

  const resetAllColors = useCallback(() => {
    updatePreferences({ customColors: {} });
  }, [updatePreferences]);

  const hasCustomColor = useCallback(
    (annotationId: string): boolean => {
      return annotationId in customColors;
    },
    [customColors]
  );

  const customColorCount = useMemo(() => Object.keys(customColors).length, [customColors]);

  return {
    getColor,
    getFallacyColor,
    getRhetoricColor,
    getStructuralColor,
    setCustomColor,
    resetColor,
    resetAllColors,
    hasCustomColor,
    customColorCount,
    customColors,
  };
}

/**
 * Non-hook utility for resolving colors outside of React components.
 * Takes the customColors record directly.
 */
export function resolveAnnotationColor(
  customColors: Record<string, string>,
  annotationId: string,
  defaultColor: string
): string {
  return customColors[annotationId] || defaultColor;
}
