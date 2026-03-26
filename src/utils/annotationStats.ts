import { Descendant } from 'slate';
import { CustomText, CustomElement } from '../components/editor/types';
import { FALLACIES } from '../data/fallacies';
import { RHETORIC_TECHNIQUES } from '../data/rhetoric';
import { STRUCTURAL_MARKUPS } from '../data/structuralMarkup';
import { Speaker } from '../models/document';

export interface AnnotationCount {
  id: string;
  name: string;
  color: string;
  count: number;
  charCount: number;
  category: string;
  type: 'fallacy' | 'rhetoric' | 'structural';
}

export interface SpeakerAnnotationDetail {
  id: string;
  name: string;
  color: string;
  type: 'fallacy' | 'rhetoric' | 'structural';
  count: number;
}

export interface SpeakerStat {
  id: string;
  name: string;
  color: string;
  charCount: number;
  annotatedCharacters: number;
  coveragePercent: number;
  paragraphCount: number;
  annotationCount: number;
  annotationBreakdown: SpeakerAnnotationDetail[];
}

export interface AnnotationStats {
  totalCharacters: number;
  annotatedCharacters: number;
  unannotatedCharacters: number;
  coveragePercent: number;
  fallacyCoverage: number;
  rhetoricCoverage: number;
  structuralCoverage: number;
  fallacyCount: number;
  rhetoricCount: number;
  structuralCount: number;
  totalAnnotations: number;
  breakdown: AnnotationCount[];
  speakerStats: SpeakerStat[];
}

/**
 * Extract all text nodes from a Slate document
 */
function extractTextNodes(content: Descendant[]): CustomText[] {
  const textNodes: CustomText[] = [];

  const traverse = (nodes: Descendant[]) => {
    for (const node of nodes) {
      if ('text' in node) {
        textNodes.push(node as CustomText);
      }
      if ('children' in node && Array.isArray((node as { children: Descendant[] }).children)) {
        traverse((node as { children: Descendant[] }).children);
      }
    }
  };

  traverse(content);
  return textNodes;
}

/**
 * Calculate comprehensive annotation statistics from document content
 */
export function calculateAnnotationStats(
  content: Descendant[],
  speakers?: Speaker[]
): AnnotationStats {
  const textNodes = extractTextNodes(content);

  let totalCharacters = 0;
  let fallacyChars = 0;
  let rhetoricChars = 0;
  let structuralChars = 0;
  let annotatedChars = 0;

  // Track per-annotation character counts and instance counts
  const fallacyCharMap: Record<string, number> = {};
  const fallacyInstanceMap: Record<string, Set<string>> = {};
  const rhetoricCharMap: Record<string, number> = {};
  const rhetoricInstanceMap: Record<string, Set<string>> = {};
  const structuralCharMap: Record<string, number> = {};
  const structuralInstanceMap: Record<string, Set<string>> = {};

  for (const node of textNodes) {
    const len = node.text.length;
    totalCharacters += len;

    let hasAnnotation = false;

    if (node.fallacyMarks && node.fallacyMarks.length > 0) {
      hasAnnotation = true;
      fallacyChars += len;
      for (const mark of node.fallacyMarks) {
        fallacyCharMap[mark.fallacyId] = (fallacyCharMap[mark.fallacyId] || 0) + len;
        if (!fallacyInstanceMap[mark.fallacyId]) {
          fallacyInstanceMap[mark.fallacyId] = new Set();
        }
        fallacyInstanceMap[mark.fallacyId].add(mark.id);
      }
    }

    if (node.rhetoricMarks && node.rhetoricMarks.length > 0) {
      hasAnnotation = true;
      rhetoricChars += len;
      for (const mark of node.rhetoricMarks) {
        rhetoricCharMap[mark.rhetoricId] = (rhetoricCharMap[mark.rhetoricId] || 0) + len;
        if (!rhetoricInstanceMap[mark.rhetoricId]) {
          rhetoricInstanceMap[mark.rhetoricId] = new Set();
        }
        rhetoricInstanceMap[mark.rhetoricId].add(mark.id);
      }
    }

    if (node.structuralMarks && node.structuralMarks.length > 0) {
      hasAnnotation = true;
      structuralChars += len;
      for (const mark of node.structuralMarks) {
        structuralCharMap[mark.markupId] = (structuralCharMap[mark.markupId] || 0) + len;
        if (!structuralInstanceMap[mark.markupId]) {
          structuralInstanceMap[mark.markupId] = new Set();
        }
        structuralInstanceMap[mark.markupId].add(mark.id);
      }
    }

    if (hasAnnotation) {
      annotatedChars += len;
    }
  }

  // Build breakdown
  const breakdown: AnnotationCount[] = [];

  for (const [id, charCount] of Object.entries(fallacyCharMap)) {
    const fallacy = FALLACIES.find(f => f.id === id);
    if (fallacy) {
      breakdown.push({
        id,
        name: fallacy.name,
        color: fallacy.color,
        count: fallacyInstanceMap[id]?.size || 0,
        charCount,
        category: fallacy.category,
        type: 'fallacy',
      });
    }
  }

  for (const [id, charCount] of Object.entries(rhetoricCharMap)) {
    const rhetoric = RHETORIC_TECHNIQUES.find(r => r.id === id);
    if (rhetoric) {
      breakdown.push({
        id,
        name: rhetoric.name,
        color: rhetoric.color,
        count: rhetoricInstanceMap[id]?.size || 0,
        charCount,
        category: rhetoric.category,
        type: 'rhetoric',
      });
    }
  }

  for (const [id, charCount] of Object.entries(structuralCharMap)) {
    const structural = STRUCTURAL_MARKUPS.find(s => s.id === id);
    if (structural) {
      breakdown.push({
        id,
        name: structural.name,
        color: structural.color,
        count: structuralInstanceMap[id]?.size || 0,
        charCount,
        category: 'structural',
        type: 'structural',
      });
    }
  }

  // Sort by character count descending
  breakdown.sort((a, b) => b.charCount - a.charCount);

  const safePercent = (chars: number) =>
    totalCharacters > 0 ? Math.round((chars / totalCharacters) * 100) : 0;

  const fallacyCount = Object.values(fallacyInstanceMap).reduce((sum, s) => sum + s.size, 0);
  const rhetoricCount = Object.values(rhetoricInstanceMap).reduce((sum, s) => sum + s.size, 0);
  const structuralCount = Object.values(structuralInstanceMap).reduce((sum, s) => sum + s.size, 0);

  // Calculate speaker stats
  const speakerStats = calculateSpeakerStats(content, speakers || []);

  return {
    totalCharacters,
    annotatedCharacters: annotatedChars,
    unannotatedCharacters: totalCharacters - annotatedChars,
    coveragePercent: safePercent(annotatedChars),
    fallacyCoverage: safePercent(fallacyChars),
    rhetoricCoverage: safePercent(rhetoricChars),
    structuralCoverage: safePercent(structuralChars),
    fallacyCount,
    rhetoricCount,
    structuralCount,
    totalAnnotations: fallacyCount + rhetoricCount + structuralCount,
    breakdown,
    speakerStats,
  };
}

/**
 * Calculate per-speaker statistics from document content
 */
function calculateSpeakerStats(content: Descendant[], speakers: Speaker[]): SpeakerStat[] {
  interface SpeakerAccum {
    charCount: number;
    annotatedCharacters: number;
    paragraphCount: number;
    // Global set of all unique mark IDs (for deduped annotationCount)
    allMarkIds: Set<string>;
    // key: "fallacy:id" | "rhetoric:id" | "structural:id", value: Set of mark IDs
    annotationInstances: Record<string, Set<string>>;
  }

  const speakerMap: Record<string, SpeakerAccum> = {};

  for (const node of content) {
    const element = node as CustomElement;
    if (!('children' in element)) continue;

    const speakerId = 'speakerId' in element ? element.speakerId : undefined;
    if (!speakerId) continue;

    if (!speakerMap[speakerId]) {
      speakerMap[speakerId] = {
        charCount: 0,
        annotatedCharacters: 0,
        paragraphCount: 0,
        allMarkIds: new Set(),
        annotationInstances: {},
      };
    }

    speakerMap[speakerId].paragraphCount += 1;

    for (const child of element.children) {
      if ('text' in child) {
        const textNode = child as CustomText;
        const len = textNode.text.length;
        speakerMap[speakerId].charCount += len;

        const hasAnyMark =
          (textNode.fallacyMarks && textNode.fallacyMarks.length > 0) ||
          (textNode.rhetoricMarks && textNode.rhetoricMarks.length > 0) ||
          (textNode.structuralMarks && textNode.structuralMarks.length > 0);
        if (hasAnyMark) {
          speakerMap[speakerId].annotatedCharacters += len;
        }

        if (textNode.fallacyMarks) {
          for (const mark of textNode.fallacyMarks) {
            speakerMap[speakerId].allMarkIds.add(mark.id);
            const key = `fallacy:${mark.fallacyId}`;
            if (!speakerMap[speakerId].annotationInstances[key]) {
              speakerMap[speakerId].annotationInstances[key] = new Set();
            }
            speakerMap[speakerId].annotationInstances[key].add(mark.id);
          }
        }
        if (textNode.rhetoricMarks) {
          for (const mark of textNode.rhetoricMarks) {
            speakerMap[speakerId].allMarkIds.add(mark.id);
            const key = `rhetoric:${mark.rhetoricId}`;
            if (!speakerMap[speakerId].annotationInstances[key]) {
              speakerMap[speakerId].annotationInstances[key] = new Set();
            }
            speakerMap[speakerId].annotationInstances[key].add(mark.id);
          }
        }
        if (textNode.structuralMarks) {
          for (const mark of textNode.structuralMarks) {
            speakerMap[speakerId].allMarkIds.add(mark.id);
            const key = `structural:${mark.markupId}`;
            if (!speakerMap[speakerId].annotationInstances[key]) {
              speakerMap[speakerId].annotationInstances[key] = new Set();
            }
            speakerMap[speakerId].annotationInstances[key].add(mark.id);
          }
        }
      }
    }
  }

  const result: SpeakerStat[] = [];
  for (const [id, data] of Object.entries(speakerMap)) {
    const speaker = speakers.find(s => s.id === id);
    if (!speaker) continue;

    const annotationBreakdown: SpeakerAnnotationDetail[] = [];
    for (const [compositeKey, markIds] of Object.entries(data.annotationInstances)) {
      const [type, annotationId] = compositeKey.split(':') as [
        'fallacy' | 'rhetoric' | 'structural',
        string,
      ];
      let name = annotationId;
      let color = '#9CA3AF';

      if (type === 'fallacy') {
        const f = FALLACIES.find(x => x.id === annotationId);
        if (f) {
          name = f.name;
          color = f.color;
        }
      } else if (type === 'rhetoric') {
        const r = RHETORIC_TECHNIQUES.find(x => x.id === annotationId);
        if (r) {
          name = r.name;
          color = r.color;
        }
      } else {
        const s = STRUCTURAL_MARKUPS.find(x => x.id === annotationId);
        if (s) {
          name = s.name;
          color = s.color;
        }
      }

      annotationBreakdown.push({ id: annotationId, name, color, type, count: markIds.size });
    }
    annotationBreakdown.sort((a, b) => b.count - a.count);

    const coveragePercent =
      data.charCount > 0 ? Math.round((data.annotatedCharacters / data.charCount) * 100) : 0;

    result.push({
      id,
      name: speaker.name,
      color: speaker.color,
      charCount: data.charCount,
      annotatedCharacters: data.annotatedCharacters,
      coveragePercent,
      paragraphCount: data.paragraphCount,
      annotationCount: data.allMarkIds.size,
      annotationBreakdown,
    });
  }

  result.sort((a, b) => b.charCount - a.charCount);
  return result;
}
