import { Descendant } from 'slate';

// Copy of the function from EditorPage for testing
// This function extracts unique fallacy and rhetoric IDs from document content
const extractUsedAnnotations = (content: Descendant[]): { fallacyIds: string[]; rhetoricIds: string[] } => {
  const fallacyIds = new Set<string>();
  const rhetoricIds = new Set<string>();
  
  const traverse = (nodes: Descendant[]) => {
    for (const node of nodes) {
      if ('text' in node) {
        const textNode = node as { fallacyMarks?: Array<{ fallacyId: string }>; rhetoricMarks?: Array<{ rhetoricId: string }> };
        if (textNode.fallacyMarks) {
          for (const mark of textNode.fallacyMarks) {
            fallacyIds.add(mark.fallacyId);
          }
        }
        if (textNode.rhetoricMarks) {
          for (const mark of textNode.rhetoricMarks) {
            rhetoricIds.add(mark.rhetoricId);
          }
        }
      }
      if ('children' in node) {
        traverse((node as { children: Descendant[] }).children);
      }
    }
  };
  
  traverse(content);
  return { fallacyIds: Array.from(fallacyIds), rhetoricIds: Array.from(rhetoricIds) };
};

describe('extractUsedAnnotations', () => {
  it('should return empty arrays for empty content', () => {
    const content: Descendant[] = [];
    const result = extractUsedAnnotations(content);
    
    expect(result.fallacyIds).toEqual([]);
    expect(result.rhetoricIds).toEqual([]);
  });

  it('should return empty arrays for content with no annotations', () => {
    const content: Descendant[] = [
      {
        type: 'paragraph',
        children: [{ text: 'Hello world' }],
      },
    ];
    const result = extractUsedAnnotations(content);
    
    expect(result.fallacyIds).toEqual([]);
    expect(result.rhetoricIds).toEqual([]);
  });

  it('should extract fallacy IDs from annotated content', () => {
    const content: Descendant[] = [
      {
        type: 'paragraph',
        children: [
          { text: 'Normal text' },
          { 
            text: 'Fallacy text', 
            fallacyMarks: [{ fallacyId: 'straw-man' }] 
          } as unknown as { text: string },
        ],
      },
    ];
    const result = extractUsedAnnotations(content);
    
    expect(result.fallacyIds).toContain('straw-man');
    expect(result.rhetoricIds).toEqual([]);
  });

  it('should extract rhetoric IDs from annotated content', () => {
    const content: Descendant[] = [
      {
        type: 'paragraph',
        children: [
          { text: 'Normal text' },
          { 
            text: 'Rhetoric text', 
            rhetoricMarks: [{ rhetoricId: 'ethos-appeal' }] 
          } as unknown as { text: string },
        ],
      },
    ];
    const result = extractUsedAnnotations(content);
    
    expect(result.fallacyIds).toEqual([]);
    expect(result.rhetoricIds).toContain('ethos-appeal');
  });

  it('should extract both fallacy and rhetoric IDs', () => {
    const content: Descendant[] = [
      {
        type: 'paragraph',
        children: [
          { 
            text: 'Fallacy text', 
            fallacyMarks: [{ fallacyId: 'ad-hominem' }] 
          } as unknown as { text: string },
          { 
            text: 'Rhetoric text', 
            rhetoricMarks: [{ rhetoricId: 'pathos-fear' }] 
          } as unknown as { text: string },
        ],
      },
    ];
    const result = extractUsedAnnotations(content);
    
    expect(result.fallacyIds).toContain('ad-hominem');
    expect(result.rhetoricIds).toContain('pathos-fear');
  });

  it('should return unique IDs only (no duplicates)', () => {
    const content: Descendant[] = [
      {
        type: 'paragraph',
        children: [
          { 
            text: 'First straw man', 
            fallacyMarks: [{ fallacyId: 'straw-man' }] 
          } as unknown as { text: string },
          { 
            text: 'Second straw man', 
            fallacyMarks: [{ fallacyId: 'straw-man' }] 
          } as unknown as { text: string },
        ],
      },
    ];
    const result = extractUsedAnnotations(content);
    
    expect(result.fallacyIds).toEqual(['straw-man']);
    expect(result.fallacyIds.length).toBe(1);
  });

  it('should handle multiple annotations on the same text', () => {
    const content: Descendant[] = [
      {
        type: 'paragraph',
        children: [
          { 
            text: 'Doubly annotated', 
            fallacyMarks: [
              { fallacyId: 'straw-man' },
              { fallacyId: 'ad-hominem' }
            ] 
          } as unknown as { text: string },
        ],
      },
    ];
    const result = extractUsedAnnotations(content);
    
    expect(result.fallacyIds).toContain('straw-man');
    expect(result.fallacyIds).toContain('ad-hominem');
    expect(result.fallacyIds.length).toBe(2);
  });

  it('should traverse nested content structures', () => {
    const content: Descendant[] = [
      {
        type: 'paragraph',
        children: [
          {
            type: 'paragraph',
            children: [
              { 
                text: 'Nested fallacy', 
                fallacyMarks: [{ fallacyId: 'false-dilemma' }] 
              } as unknown as { text: string },
            ],
          } as unknown as Descendant,
        ],
      },
    ];
    const result = extractUsedAnnotations(content);
    
    expect(result.fallacyIds).toContain('false-dilemma');
  });
});
