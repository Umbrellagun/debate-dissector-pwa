import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnnotationStatsPanel } from '../AnnotationStatsPanel';
import { AnnotationStats } from '../../../utils/annotationStats';

const emptyStats: AnnotationStats = {
  totalCharacters: 0,
  annotatedCharacters: 0,
  unannotatedCharacters: 0,
  coveragePercent: 0,
  fallacyCoverage: 0,
  rhetoricCoverage: 0,
  structuralCoverage: 0,
  fallacyCount: 0,
  rhetoricCount: 0,
  structuralCount: 0,
  totalAnnotations: 0,
  breakdown: [],
  speakerStats: [],
};

const populatedStats: AnnotationStats = {
  totalCharacters: 1000,
  annotatedCharacters: 400,
  unannotatedCharacters: 600,
  coveragePercent: 40,
  fallacyCoverage: 20,
  rhetoricCoverage: 15,
  structuralCoverage: 10,
  fallacyCount: 3,
  rhetoricCount: 2,
  structuralCount: 1,
  totalAnnotations: 6,
  breakdown: [
    {
      id: 'straw-man',
      name: 'Straw Man',
      color: '#EF4444',
      count: 2,
      charCount: 120,
      category: 'informal',
      type: 'fallacy',
    },
    {
      id: 'ad-hominem',
      name: 'Ad Hominem',
      color: '#F87171',
      count: 1,
      charCount: 80,
      category: 'informal',
      type: 'fallacy',
    },
    {
      id: 'appeal-to-authority',
      name: 'Appeal to Authority',
      color: '#3B82F6',
      count: 2,
      charCount: 150,
      category: 'ethos',
      type: 'rhetoric',
    },
    {
      id: 'claim',
      name: 'Claim',
      color: '#8B5CF6',
      count: 1,
      charCount: 100,
      category: 'structural',
      type: 'structural',
    },
  ],
  speakerStats: [
    {
      id: 's1',
      name: 'Speaker A',
      color: '#3B82F6',
      charCount: 600,
      annotatedCharacters: 240,
      coveragePercent: 40,
      paragraphCount: 5,
      annotationCount: 3,
      annotationBreakdown: [
        { id: 'straw-man', name: 'Straw Man', color: '#EF4444', type: 'fallacy', count: 2 },
        {
          id: 'appeal-to-authority',
          name: 'Appeal to Authority',
          color: '#3B82F6',
          type: 'rhetoric',
          count: 1,
        },
      ],
    },
    {
      id: 's2',
      name: 'Speaker B',
      color: '#EF4444',
      charCount: 400,
      annotatedCharacters: 160,
      coveragePercent: 40,
      paragraphCount: 3,
      annotationCount: 2,
      annotationBreakdown: [
        { id: 'ad-hominem', name: 'Ad Hominem', color: '#F87171', type: 'fallacy', count: 1 },
        { id: 'claim', name: 'Claim', color: '#8B5CF6', type: 'structural', count: 1 },
      ],
    },
  ],
};

describe('AnnotationStatsPanel', () => {
  describe('header', () => {
    it('renders the Statistics header', () => {
      render(<AnnotationStatsPanel stats={emptyStats} documentTitle="Test" />);
      expect(screen.getByText('Statistics')).toBeInTheDocument();
    });

    it('renders close button when onClose is provided', () => {
      const onClose = jest.fn();
      render(<AnnotationStatsPanel stats={emptyStats} documentTitle="Test" onClose={onClose} />);

      const closeBtn = screen.getByLabelText('Close statistics');
      expect(closeBtn).toBeInTheDocument();
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not render close button when onClose is not provided', () => {
      render(<AnnotationStatsPanel stats={emptyStats} documentTitle="Test" />);
      expect(screen.queryByLabelText('Close statistics')).not.toBeInTheDocument();
    });
  });

  describe('tabs', () => {
    it('renders Overview and Breakdown tabs', () => {
      render(<AnnotationStatsPanel stats={populatedStats} documentTitle="Test" />);
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Breakdown')).toBeInTheDocument();
    });

    it('shows overview tab by default', () => {
      render(<AnnotationStatsPanel stats={populatedStats} documentTitle="Test" />);
      expect(screen.getByText('Annotations')).toBeInTheDocument();
      // "Coverage" appears in pie chart center and summary card
      expect(screen.getAllByText('Coverage').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Characters')).toBeInTheDocument();
    });

    it('switches to breakdown tab when clicked', () => {
      render(<AnnotationStatsPanel stats={populatedStats} documentTitle="Test" />);
      fireEvent.click(screen.getByText('Breakdown'));

      // Should show type headers
      expect(screen.getByText(/Fallacies \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Rhetoric \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Claims & Evidence \(1\)/)).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no content', () => {
      render(<AnnotationStatsPanel stats={emptyStats} documentTitle="Test" />);
      expect(screen.getByText('No content to analyze.')).toBeInTheDocument();
    });
  });

  describe('overview tab', () => {
    it('shows summary numbers', () => {
      render(<AnnotationStatsPanel stats={populatedStats} documentTitle="Test" />);
      expect(screen.getByText('6')).toBeInTheDocument(); // totalAnnotations
      expect(screen.getByText('40%')).toBeInTheDocument(); // coverage
      expect(screen.getByText('1,000')).toBeInTheDocument(); // characters
    });

    it('shows coverage by type section', () => {
      render(<AnnotationStatsPanel stats={populatedStats} documentTitle="Test" />);
      expect(screen.getByText('Coverage by Type')).toBeInTheDocument();
    });

    it('shows instance counts section', () => {
      render(<AnnotationStatsPanel stats={populatedStats} documentTitle="Test" />);
      expect(screen.getByText('Instance Counts')).toBeInTheDocument();
    });
  });

  describe('breakdown tab', () => {
    it('shows all annotation types in breakdown', () => {
      render(<AnnotationStatsPanel stats={populatedStats} documentTitle="Test" />);
      fireEvent.click(screen.getByText('Breakdown'));

      // Names may appear multiple times (main breakdown + speaker cards), use getAllByText
      expect(screen.getAllByText('Straw Man').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Ad Hominem').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Appeal to Authority').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Claim').length).toBeGreaterThanOrEqual(1);
    });

    it('shows instance counts per annotation', () => {
      render(<AnnotationStatsPanel stats={populatedStats} documentTitle="Test" />);
      fireEvent.click(screen.getByText('Breakdown'));

      // Multiple items may share the same count text, so use getAllByText
      const twoCounts = screen.getAllByText('2x');
      expect(twoCounts.length).toBeGreaterThanOrEqual(1);
      const oneCounts = screen.getAllByText('1x');
      expect(oneCounts.length).toBeGreaterThanOrEqual(1);
    });

    it('shows empty breakdown message when no annotations', () => {
      const noAnnotations: AnnotationStats = {
        ...emptyStats,
        totalCharacters: 100,
      };
      render(<AnnotationStatsPanel stats={noAnnotations} documentTitle="Test" />);
      fireEvent.click(screen.getByText('Breakdown'));

      expect(screen.getByText('No annotations yet.')).toBeInTheDocument();
    });

    it('calls onAnnotationClick when a breakdown item is clicked', () => {
      const onAnnotationClick = jest.fn();
      render(
        <AnnotationStatsPanel
          stats={populatedStats}
          documentTitle="Test"
          onAnnotationClick={onAnnotationClick}
        />
      );
      fireEvent.click(screen.getByText('Breakdown'));
      // "Straw Man" appears in main breakdown and speaker card; click the first one
      fireEvent.click(screen.getAllByText('Straw Man')[0]);

      expect(onAnnotationClick).toHaveBeenCalledWith('straw-man', 'fallacy');
    });

    it('calls onAnnotationClick with rhetoric type for rhetoric items', () => {
      const onAnnotationClick = jest.fn();
      render(
        <AnnotationStatsPanel
          stats={populatedStats}
          documentTitle="Test"
          onAnnotationClick={onAnnotationClick}
        />
      );
      fireEvent.click(screen.getByText('Breakdown'));
      fireEvent.click(screen.getAllByText('Appeal to Authority')[0]);

      expect(onAnnotationClick).toHaveBeenCalledWith('appeal-to-authority', 'rhetoric');
    });

    it('calls onAnnotationClick with structural type for structural items', () => {
      const onAnnotationClick = jest.fn();
      render(
        <AnnotationStatsPanel
          stats={populatedStats}
          documentTitle="Test"
          onAnnotationClick={onAnnotationClick}
        />
      );
      fireEvent.click(screen.getByText('Breakdown'));
      fireEvent.click(screen.getAllByText('Claim')[0]);

      expect(onAnnotationClick).toHaveBeenCalledWith('claim', 'structural');
    });

    it('shows chevron icons when onAnnotationClick is provided', () => {
      const onAnnotationClick = jest.fn();
      const { container } = render(
        <AnnotationStatsPanel
          stats={populatedStats}
          documentTitle="Test"
          onAnnotationClick={onAnnotationClick}
        />
      );
      fireEvent.click(screen.getByText('Breakdown'));

      // Chevrons in main breakdown rows (4) + speaker annotation rows (4)
      const chevrons = container.querySelectorAll('button svg path[d="M9 5l7 7-7 7"]');
      expect(chevrons.length).toBe(8);
    });
  });

  describe('speaker stats', () => {
    it('shows speaker section when speakers exist', () => {
      render(<AnnotationStatsPanel stats={populatedStats} documentTitle="Test" />);
      expect(screen.getByText('By Speaker')).toBeInTheDocument();
    });

    it('shows speaker names', () => {
      render(<AnnotationStatsPanel stats={populatedStats} documentTitle="Test" />);
      expect(screen.getByText('Speaker A')).toBeInTheDocument();
      expect(screen.getByText('Speaker B')).toBeInTheDocument();
    });

    it('shows speaker character counts, coverage, and paragraph counts', () => {
      render(<AnnotationStatsPanel stats={populatedStats} documentTitle="Test" />);
      expect(screen.getByText('600 chars')).toBeInTheDocument();
      expect(screen.getByText('5 paragraphs')).toBeInTheDocument();
      expect(screen.getByText('400 chars')).toBeInTheDocument();
      expect(screen.getByText('3 paragraphs')).toBeInTheDocument();
      // Coverage % per speaker
      expect(screen.getAllByText('40% annotated').length).toBe(2);
    });

    it('does not show speaker section when no speakers', () => {
      render(<AnnotationStatsPanel stats={emptyStats} documentTitle="Test" />);
      expect(screen.queryByText('By Speaker')).not.toBeInTheDocument();
    });
  });
});
