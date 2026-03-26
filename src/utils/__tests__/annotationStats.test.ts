import { Descendant } from 'slate';
import { calculateAnnotationStats } from '../annotationStats';

// Helper to create a paragraph with plain text
const plainParagraph = (text: string): Descendant => ({
  type: 'paragraph',
  children: [{ text }],
});

// Helper to create a paragraph with a fallacy mark
const fallacyParagraph = (text: string, fallacyId: string): Descendant => ({
  type: 'paragraph',
  children: [
    {
      text,
      fallacyMarks: [
        { id: `mark-${fallacyId}-1`, fallacyId, color: '#EF4444', appliedAt: Date.now() },
      ],
    } as any,
  ],
});

// Helper to create a paragraph with a rhetoric mark
const rhetoricParagraph = (text: string, rhetoricId: string): Descendant => ({
  type: 'paragraph',
  children: [
    {
      text,
      rhetoricMarks: [
        { id: `mark-${rhetoricId}-1`, rhetoricId, color: '#3B82F6', appliedAt: Date.now() },
      ],
    } as any,
  ],
});

// Helper to create a paragraph with a structural mark
const structuralParagraph = (text: string, markupId: string): Descendant => ({
  type: 'paragraph',
  children: [
    {
      text,
      structuralMarks: [
        { id: `mark-${markupId}-1`, markupId, color: '#8B5CF6', appliedAt: Date.now() },
      ],
    } as any,
  ],
});

describe('calculateAnnotationStats', () => {
  describe('empty and basic content', () => {
    it('should return zero stats for empty content', () => {
      const stats = calculateAnnotationStats([]);
      expect(stats.totalCharacters).toBe(0);
      expect(stats.annotatedCharacters).toBe(0);
      expect(stats.unannotatedCharacters).toBe(0);
      expect(stats.coveragePercent).toBe(0);
      expect(stats.totalAnnotations).toBe(0);
      expect(stats.breakdown).toEqual([]);
      expect(stats.speakerStats).toEqual([]);
    });

    it('should count total characters with no annotations', () => {
      const content = [plainParagraph('Hello world')];
      const stats = calculateAnnotationStats(content);

      expect(stats.totalCharacters).toBe(11);
      expect(stats.annotatedCharacters).toBe(0);
      expect(stats.unannotatedCharacters).toBe(11);
      expect(stats.coveragePercent).toBe(0);
      expect(stats.totalAnnotations).toBe(0);
    });

    it('should handle multiple plain paragraphs', () => {
      const content = [plainParagraph('Hello'), plainParagraph('World')];
      const stats = calculateAnnotationStats(content);

      expect(stats.totalCharacters).toBe(10);
      expect(stats.annotatedCharacters).toBe(0);
    });
  });

  describe('fallacy annotations', () => {
    it('should calculate fallacy coverage', () => {
      const content: Descendant[] = [
        {
          type: 'paragraph',
          children: [
            { text: 'Plain ' },
            {
              text: 'straw man',
              fallacyMarks: [
                { id: 'f1', fallacyId: 'straw-man', color: '#EF4444', appliedAt: Date.now() },
              ],
            } as any,
          ],
        },
      ];
      const stats = calculateAnnotationStats(content);

      expect(stats.totalCharacters).toBe(15); // "Plain " + "straw man"
      expect(stats.annotatedCharacters).toBe(9); // "straw man"
      expect(stats.fallacyCount).toBe(1);
      expect(stats.fallacyCoverage).toBe(60); // 9/15 = 60%
      expect(stats.breakdown.length).toBe(1);
      expect(stats.breakdown[0].id).toBe('straw-man');
      expect(stats.breakdown[0].type).toBe('fallacy');
    });

    it('should count unique fallacy instances by mark ID', () => {
      const content: Descendant[] = [
        {
          type: 'paragraph',
          children: [
            {
              text: 'first',
              fallacyMarks: [
                { id: 'f1', fallacyId: 'straw-man', color: '#EF4444', appliedAt: Date.now() },
              ],
            } as any,
            {
              text: 'second',
              fallacyMarks: [
                { id: 'f1', fallacyId: 'straw-man', color: '#EF4444', appliedAt: Date.now() },
              ],
            } as any,
          ],
        },
      ];
      const stats = calculateAnnotationStats(content);

      // Same mark ID across text nodes = 1 instance
      expect(stats.fallacyCount).toBe(1);
    });

    it('should count different fallacy mark IDs as separate instances', () => {
      const content: Descendant[] = [
        {
          type: 'paragraph',
          children: [
            {
              text: 'first',
              fallacyMarks: [
                { id: 'f1', fallacyId: 'straw-man', color: '#EF4444', appliedAt: Date.now() },
              ],
            } as any,
            {
              text: 'second',
              fallacyMarks: [
                { id: 'f2', fallacyId: 'straw-man', color: '#EF4444', appliedAt: Date.now() },
              ],
            } as any,
          ],
        },
      ];
      const stats = calculateAnnotationStats(content);

      expect(stats.fallacyCount).toBe(2);
      expect(stats.breakdown[0].count).toBe(2);
    });
  });

  describe('rhetoric annotations', () => {
    it('should calculate rhetoric coverage', () => {
      const content = [rhetoricParagraph('appeal to authority', 'appeal-to-authority')];
      const stats = calculateAnnotationStats(content);

      expect(stats.annotatedCharacters).toBe(19);
      expect(stats.rhetoricCount).toBe(1);
      expect(stats.rhetoricCoverage).toBe(100);
      expect(stats.breakdown[0].type).toBe('rhetoric');
    });
  });

  describe('structural annotations', () => {
    it('should calculate structural coverage', () => {
      const content = [structuralParagraph('this is a claim', 'claim')];
      const stats = calculateAnnotationStats(content);

      expect(stats.annotatedCharacters).toBe(15);
      expect(stats.structuralCount).toBe(1);
      expect(stats.structuralCoverage).toBe(100);
      expect(stats.breakdown[0].type).toBe('structural');
    });
  });

  describe('mixed annotations', () => {
    it('should track all three types independently', () => {
      const content: Descendant[] = [
        fallacyParagraph('fallacy text', 'straw-man'),
        rhetoricParagraph('rhetoric text', 'appeal-to-authority'),
        structuralParagraph('claim text', 'claim'),
      ];
      const stats = calculateAnnotationStats(content);

      expect(stats.fallacyCount).toBe(1);
      expect(stats.rhetoricCount).toBe(1);
      expect(stats.structuralCount).toBe(1);
      expect(stats.totalAnnotations).toBe(3);
      expect(stats.coveragePercent).toBe(100);
      expect(stats.breakdown.length).toBe(3);
    });

    it('should calculate correct coverage with mixed annotated and plain text', () => {
      const content: Descendant[] = [
        plainParagraph('aaaa'), // 4 chars plain
        fallacyParagraph('bbbb', 'straw-man'), // 4 chars annotated
        plainParagraph('cccc'), // 4 chars plain
        rhetoricParagraph('dddd', 'appeal-to-authority'), // 4 chars annotated
      ];
      const stats = calculateAnnotationStats(content);

      expect(stats.totalCharacters).toBe(16);
      expect(stats.annotatedCharacters).toBe(8);
      expect(stats.coveragePercent).toBe(50);
    });
  });

  describe('breakdown sorting', () => {
    it('should sort breakdown by character count descending', () => {
      const content: Descendant[] = [
        fallacyParagraph('ab', 'straw-man'), // 2 chars
        rhetoricParagraph('abcdef', 'appeal-to-authority'), // 6 chars
        structuralParagraph('abcd', 'claim'), // 4 chars
      ];
      const stats = calculateAnnotationStats(content);

      expect(stats.breakdown[0].id).toBe('appeal-to-authority');
      expect(stats.breakdown[1].id).toBe('claim');
      expect(stats.breakdown[2].id).toBe('straw-man');
    });
  });

  describe('nested content', () => {
    it('should traverse block-quote children', () => {
      const content: Descendant[] = [
        {
          type: 'block-quote',
          children: [
            {
              text: 'quoted fallacy',
              fallacyMarks: [
                { id: 'f1', fallacyId: 'ad-hominem', color: '#F87171', appliedAt: Date.now() },
              ],
            } as any,
          ],
        },
      ];
      const stats = calculateAnnotationStats(content);

      expect(stats.fallacyCount).toBe(1);
      expect(stats.annotatedCharacters).toBe(14);
    });
  });
});

describe('speaker stats', () => {
  it('should return empty speakerStats when no speakers provided', () => {
    const content = [plainParagraph('Hello')];
    const stats = calculateAnnotationStats(content);
    expect(stats.speakerStats).toEqual([]);
  });

  it('should calculate per-speaker character counts', () => {
    const speakers = [
      { id: 's1', name: 'Speaker A', color: '#3B82F6' },
      { id: 's2', name: 'Speaker B', color: '#EF4444' },
    ];
    const content: any[] = [
      { type: 'paragraph', speakerId: 's1', children: [{ text: 'Hello' }] },
      { type: 'paragraph', speakerId: 's2', children: [{ text: 'World!!' }] },
    ];
    const stats = calculateAnnotationStats(content, speakers);

    expect(stats.speakerStats.length).toBe(2);
    const a = stats.speakerStats.find(s => s.id === 's1')!;
    const b = stats.speakerStats.find(s => s.id === 's2')!;
    expect(a.charCount).toBe(5);
    expect(b.charCount).toBe(7);
    expect(a.paragraphCount).toBe(1);
    expect(b.paragraphCount).toBe(1);
  });

  it('should count annotations per speaker', () => {
    const speakers = [{ id: 's1', name: 'Speaker A', color: '#3B82F6' }];
    const content: any[] = [
      {
        type: 'paragraph',
        speakerId: 's1',
        children: [
          {
            text: 'fallacy text',
            fallacyMarks: [
              { id: 'f1', fallacyId: 'straw-man', color: '#EF4444', appliedAt: Date.now() },
            ],
          },
        ],
      },
    ];
    const stats = calculateAnnotationStats(content, speakers);

    expect(stats.speakerStats[0].annotationCount).toBe(1);
  });

  it('should sort speakers by character count descending', () => {
    const speakers = [
      { id: 's1', name: 'Speaker A', color: '#3B82F6' },
      { id: 's2', name: 'Speaker B', color: '#EF4444' },
    ];
    const content: any[] = [
      { type: 'paragraph', speakerId: 's1', children: [{ text: 'Hi' }] },
      { type: 'paragraph', speakerId: 's2', children: [{ text: 'Much longer text here' }] },
    ];
    const stats = calculateAnnotationStats(content, speakers);

    expect(stats.speakerStats[0].id).toBe('s2');
    expect(stats.speakerStats[1].id).toBe('s1');
  });
});
