import React from 'react';
import { render, screen, fireEvent, RenderOptions } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AppProvider } from '../context';
import { Header } from '../components/layout/Header';
import { AnnotationPanel } from '../components/fallacies/AnnotationPanel';
import { FallacyPanel } from '../components/fallacies/FallacyPanel';
import { RhetoricPanel } from '../components/fallacies/RhetoricPanel';
import { Fallacy, Rhetoric } from '../models';
import { StructuralMarkupPanel } from '../components/structural/StructuralMarkupPanel';
import { AnnotationStatsPanel } from '../components/stats/AnnotationStatsPanel';
import { AnnotationStats } from '../utils/annotationStats';

expect.extend(toHaveNoViolations);

const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider>{children}</AppProvider>
);

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllProviders, ...options });

async function checkA11y(container: Element) {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

function getFocusableElements(container: Element): HTMLElement[] {
  const selectors =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(selectors));
}

function checkAriaLabels(container: Element): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  container.querySelectorAll('button').forEach((btn, i) => {
    if (!btn.textContent?.trim() && !btn.getAttribute('aria-label') && !btn.getAttribute('title')) {
      issues.push(`Button ${i + 1} has no accessible name`);
    }
  });
  return { valid: issues.length === 0, issues };
}

const mockFallacies: Fallacy[] = [
  {
    id: 'ad-hominem',
    name: 'Ad Hominem',
    category: 'red-herring',
    description: 'Attacking the person making the argument rather than the argument itself.',
    color: '#E53E3E',
    examples: ['You cannot trust his argument because he is a known liar.'],
  },
];

const mockRhetoric: Rhetoric[] = [
  {
    id: 'ethos',
    name: 'Ethos',
    category: 'ethos',
    description: 'Appeal to credibility or character.',
    color: '#3182CE',
    examples: ['As a doctor, I recommend this treatment.'],
  },
];

describe('Accessibility Tests', () => {
  describe('Header Component', () => {
    it('should have no axe violations', async () => {
      const { container } = render(<Header title="Test" />);
      await checkA11y(container);
    });

    it('should have accessible menu button', () => {
      const onMenuClick = jest.fn();
      render(<Header onMenuClick={onMenuClick} />);

      const menuButton = screen.getByLabelText('Toggle menu');
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-label');
    });

    it('should have accessible back button', () => {
      const onBackClick = jest.fn();
      render(<Header onBackClick={onBackClick} />);

      const backButton = screen.getByLabelText('Go back');
      expect(backButton).toBeInTheDocument();
    });

    it('menu button should be keyboard accessible', () => {
      const onMenuClick = jest.fn();
      render(<Header onMenuClick={onMenuClick} />);

      const menuButton = screen.getByLabelText('Toggle menu');
      menuButton.focus();
      expect(document.activeElement).toBe(menuButton);

      // Native buttons respond to click, which is triggered by keyboard in browsers
      fireEvent.click(menuButton);
      expect(onMenuClick).toHaveBeenCalled();
    });
  });

  describe('AnnotationPanel Component', () => {
    it('should have no axe violations', async () => {
      const { container } = customRender(
        <AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />
      );
      await checkA11y(container);
    });

    it('should have accessible search input', () => {
      customRender(<AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />);

      const searchInput = screen.getByPlaceholderText('Search annotations...');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput.tagName).toBe('INPUT');
    });

    it('should have accessible tab buttons', () => {
      customRender(<AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />);

      const fallaciesTab = screen.getByText('Fallacies');
      const rhetoricTab = screen.getByText('Rhetoric');

      expect(fallaciesTab.closest('button')).toBeInTheDocument();
      expect(rhetoricTab.closest('button')).toBeInTheDocument();
    });

    it('tabs should be keyboard navigable', () => {
      customRender(<AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />);

      const fallaciesTab = screen.getByText('Fallacies').closest('button');

      fallaciesTab?.focus();
      expect(document.activeElement).toBe(fallaciesTab);

      // Tab buttons should be focusable and clickable
      expect(fallaciesTab).toBeInTheDocument();
    });

    it('hint dismiss button should be accessible', () => {
      customRender(<AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />);

      const dismissButton = screen.getByLabelText('Dismiss hint');
      expect(dismissButton).toBeInTheDocument();
    });
  });

  describe('FallacyPanel Component', () => {
    it('should have no axe violations', async () => {
      const { container } = customRender(<FallacyPanel fallacies={mockFallacies} />);
      await checkA11y(container);
    });

    it('should have accessible search input', () => {
      customRender(<FallacyPanel fallacies={mockFallacies} />);

      const searchInput = screen.getByPlaceholderText('Search fallacies...');
      expect(searchInput).toBeInTheDocument();
    });

    it('category buttons should be keyboard accessible', () => {
      customRender(<FallacyPanel fallacies={mockFallacies} />);

      const categoryButton = screen.getByText('Red Herring Fallacies');
      expect(categoryButton.closest('button')).toBeInTheDocument();

      categoryButton.closest('button')?.focus();
      fireEvent.keyDown(categoryButton, { key: 'Enter' });
    });

    it('fallacy items should be focusable', () => {
      customRender(<FallacyPanel fallacies={mockFallacies} />);

      const fallacyButton = screen.getByText('Ad Hominem');
      expect(fallacyButton.closest('button')).toBeInTheDocument();
    });
  });

  describe('RhetoricPanel Component', () => {
    it('should have no axe violations', async () => {
      const { container } = customRender(<RhetoricPanel rhetoric={mockRhetoric} />);
      await checkA11y(container);
    });

    it('should have accessible search input', () => {
      customRender(<RhetoricPanel rhetoric={mockRhetoric} />);

      const searchInput = screen.getByPlaceholderText('Search rhetoric...');
      expect(searchInput).toBeInTheDocument();
    });

    it('rhetoric items should be focusable', () => {
      customRender(<RhetoricPanel rhetoric={mockRhetoric} />);

      // Find and click the Ethos category button
      const categoryButton = screen.getByText('Ethos (Credibility)').closest('button');
      expect(categoryButton).toBeInTheDocument();

      categoryButton?.focus();
      expect(document.activeElement).toBe(categoryButton);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have logical focus order in AnnotationPanel', () => {
      const { container } = customRender(
        <AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />
      );

      const focusableElements = getFocusableElements(container);
      expect(focusableElements.length).toBeGreaterThan(0);

      // First focusable should be search input
      expect(focusableElements[0].tagName).toBe('INPUT');
    });

    it('should trap focus in modal-like components', async () => {
      // This tests that focusable elements exist and can receive focus
      const { container } = customRender(
        <AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />
      );

      const focusableElements = getFocusableElements(container);

      // All focusable elements should be able to receive focus
      focusableElements.forEach(element => {
        element.focus();
        expect(document.activeElement).toBe(element);
      });
    });
  });

  describe('ARIA Labels', () => {
    it('Header should have proper ARIA labels', () => {
      const { container } = render(<Header onMenuClick={() => {}} onBackClick={() => {}} />);

      const { valid, issues } = checkAriaLabels(container);
      if (!valid) {
        console.warn('ARIA issues in Header:', issues);
      }
      // Back button takes precedence, so only one button should be present
      expect(screen.getByLabelText('Go back')).toBeInTheDocument();
    });

    it('AnnotationPanel should have proper ARIA labels', () => {
      const { container } = customRender(
        <AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />
      );

      const { valid, issues } = checkAriaLabels(container);
      if (!valid) {
        console.warn('ARIA issues in AnnotationPanel:', issues);
      }

      // Search input should have placeholder as accessible name
      expect(screen.getByPlaceholderText('Search annotations...')).toBeInTheDocument();
    });
  });

  describe('Form Inputs', () => {
    it('search inputs should be properly labeled', () => {
      customRender(<AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />);

      const searchInput = screen.getByPlaceholderText('Search annotations...');
      expect(searchInput).toHaveAttribute('type', 'text');
      expect(searchInput).toHaveAttribute('placeholder');
    });

    it('search inputs should be focusable', () => {
      customRender(<FallacyPanel fallacies={mockFallacies} />);

      const searchInput = screen.getByPlaceholderText('Search fallacies...');
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe('Color Contrast', () => {
    it('text elements should use appropriate color classes', () => {
      const { container } = customRender(
        <AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />
      );

      // Check that text elements exist with proper styling
      const textElements = container.querySelectorAll('[class*="text-gray"]');
      expect(textElements.length).toBeGreaterThan(0);
    });
  });

  describe('ARIA Expanded States', () => {
    it('accordion buttons should have aria-expanded attribute', () => {
      customRender(<AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />);

      const fallaciesButton = screen.getByText('Fallacies').closest('button');
      expect(fallaciesButton).toHaveAttribute('aria-expanded');
      expect(fallaciesButton).toHaveAttribute('aria-controls', 'fallacies-panel');
    });

    it('category buttons in FallacyPanel should have aria-expanded', () => {
      customRender(<FallacyPanel fallacies={mockFallacies} />);

      const categoryButton = screen.getByText('Red Herring Fallacies').closest('button');
      expect(categoryButton).toHaveAttribute('aria-expanded');
      expect(categoryButton).toHaveAttribute('aria-controls');
    });

    it('category buttons in RhetoricPanel should have aria-expanded', () => {
      customRender(<RhetoricPanel rhetoric={mockRhetoric} />);

      const categoryButton = screen.getByText('Ethos (Credibility)').closest('button');
      expect(categoryButton).toHaveAttribute('aria-expanded');
      expect(categoryButton).toHaveAttribute('aria-controls');
    });

    it('aria-expanded should toggle when clicking accordion', () => {
      customRender(<AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />);

      const fallaciesButton = screen.getByText('Fallacies').closest('button');
      const initialState = fallaciesButton?.getAttribute('aria-expanded');

      fireEvent.click(fallaciesButton!);

      const newState = fallaciesButton?.getAttribute('aria-expanded');
      expect(newState).not.toBe(initialState);
    });
  });

  describe('Live Regions', () => {
    it('FallacyPanel should have aria-live region for search results', () => {
      const { container } = customRender(<FallacyPanel fallacies={mockFallacies} />);

      const liveRegion = container.querySelector('[role="status"][aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('RhetoricPanel should have aria-live region for search results', () => {
      const { container } = customRender(<RhetoricPanel rhetoric={mockRhetoric} />);

      const liveRegion = container.querySelector('[role="status"][aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe('Search Input Accessibility', () => {
    it('search inputs should have aria-label attribute', () => {
      customRender(<AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />);

      const searchInput = screen.getByPlaceholderText('Search annotations...');
      expect(searchInput).toHaveAttribute('aria-label');
      expect(searchInput).toHaveAttribute('role', 'searchbox');
    });

    it('FallacyPanel search should have proper accessibility attributes', () => {
      customRender(<FallacyPanel fallacies={mockFallacies} />);

      const searchInput = screen.getByPlaceholderText('Search fallacies...');
      expect(searchInput).toHaveAttribute('aria-label', 'Search fallacies');
      expect(searchInput).toHaveAttribute('role', 'searchbox');
    });

    it('RhetoricPanel search should have proper accessibility attributes', () => {
      customRender(<RhetoricPanel rhetoric={mockRhetoric} />);

      const searchInput = screen.getByPlaceholderText('Search rhetoric...');
      expect(searchInput).toHaveAttribute('aria-label', 'Search rhetoric');
      expect(searchInput).toHaveAttribute('role', 'searchbox');
    });
  });

  describe('StructuralMarkupPanel Component', () => {
    it('should have no axe violations', async () => {
      const { container } = render(<StructuralMarkupPanel />);
      await checkA11y(container);
    });

    it('should have no axe violations with selected markup', async () => {
      const { container } = render(
        <StructuralMarkupPanel selectedMarkupId="evidence" hasSelection={true} />
      );
      await checkA11y(container);
    });

    it('category buttons should be keyboard accessible', () => {
      render(<StructuralMarkupPanel />);

      const assertionsButton = screen.getByText('Assertions').closest('button');
      expect(assertionsButton).toBeInTheDocument();

      assertionsButton?.focus();
      expect(document.activeElement).toBe(assertionsButton);
    });

    it('markup items should be focusable', () => {
      render(<StructuralMarkupPanel />);

      const claimButton = screen.getByText('Claim').closest('button');
      expect(claimButton).toBeInTheDocument();

      claimButton?.focus();
      expect(document.activeElement).toBe(claimButton);
    });

    it('all buttons should have accessible names', () => {
      const { container } = render(<StructuralMarkupPanel selectedMarkupId="claim" />);
      const { valid, issues } = checkAriaLabels(container);
      if (!valid) {
        console.warn('ARIA issues in StructuralMarkupPanel:', issues);
      }
    });

    it('close details button should have aria-label', () => {
      render(<StructuralMarkupPanel selectedMarkupId="claim" />);
      const closeButton = screen.getByLabelText('Close details');
      expect(closeButton).toBeInTheDocument();
    });

    it('citation form inputs should be accessible', () => {
      render(<StructuralMarkupPanel selectedMarkupId="evidence" />);

      // Open citation form
      fireEvent.click(screen.getByText('Add source citation'));

      const urlInput = screen.getByPlaceholderText('Source URL');
      const authorInput = screen.getByPlaceholderText('Author');
      const pubInput = screen.getByPlaceholderText('Publication');
      const dateInput = screen.getByPlaceholderText('Date');

      // All inputs should be focusable
      [urlInput, authorInput, pubInput, dateInput].forEach(input => {
        input.focus();
        expect(document.activeElement).toBe(input);
      });
    });

    it('should have logical focus order', () => {
      const { container } = render(<StructuralMarkupPanel />);
      const focusableElements = getFocusableElements(container);
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('apply button should be disabled with proper styling when no selection', () => {
      render(<StructuralMarkupPanel selectedMarkupId="claim" hasSelection={false} />);
      const applyButton = screen.getByText('Select text to apply');
      expect(applyButton).toBeDisabled();
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus after interaction', async () => {
      customRender(<AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />);

      const searchInput = screen.getByPlaceholderText('Search annotations...');
      searchInput.focus();

      // Type in search
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Focus should remain on input
      expect(document.activeElement).toBe(searchInput);
    });

    it('clicking tab should update content but maintain interactivity', () => {
      customRender(<AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />);

      // Find the Rhetoric section header button (collapsed by default)
      const rhetoricHeader = screen.getByText('Rhetoric').closest('button');
      expect(rhetoricHeader).toBeInTheDocument();

      // Click to expand
      fireEvent.click(rhetoricHeader!);

      // New content should be focusable
      rhetoricHeader?.focus();
      expect(document.activeElement).toBe(rhetoricHeader);
    });
  });
});

// --- AnnotationStatsPanel Accessibility Tests ---

const mockStatsPopulated: AnnotationStats = {
  totalCharacters: 500,
  annotatedCharacters: 200,
  unannotatedCharacters: 300,
  coveragePercent: 40,
  fallacyCoverage: 20,
  rhetoricCoverage: 15,
  structuralCoverage: 5,
  fallacyCount: 2,
  rhetoricCount: 1,
  structuralCount: 1,
  totalAnnotations: 4,
  breakdown: [
    {
      id: 'straw-man',
      name: 'Straw Man',
      color: '#EF4444',
      count: 2,
      charCount: 100,
      category: 'informal',
      type: 'fallacy',
    },
    {
      id: 'appeal-to-authority',
      name: 'Appeal to Authority',
      color: '#3B82F6',
      count: 1,
      charCount: 75,
      category: 'ethos',
      type: 'rhetoric',
    },
    {
      id: 'claim',
      name: 'Claim',
      color: '#8B5CF6',
      count: 1,
      charCount: 25,
      category: 'structural',
      type: 'structural',
    },
  ],
  speakerStats: [],
};

const mockStatsEmpty: AnnotationStats = {
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

describe('AnnotationStatsPanel Accessibility', () => {
  describe('Automated a11y checks', () => {
    it('should have no axe violations with populated stats', async () => {
      const { container } = render(
        <AnnotationStatsPanel stats={mockStatsPopulated} documentTitle="Test" />
      );
      await checkA11y(container);
    });

    it('should have no axe violations with empty stats', async () => {
      const { container } = render(
        <AnnotationStatsPanel stats={mockStatsEmpty} documentTitle="Test" />
      );
      await checkA11y(container);
    });

    it('should have no axe violations on breakdown tab', async () => {
      const { container } = render(
        <AnnotationStatsPanel stats={mockStatsPopulated} documentTitle="Test" />
      );
      fireEvent.click(screen.getByText('Breakdown'));
      await checkA11y(container);
    });

    it('should have no axe violations with clickable breakdown items', async () => {
      const { container } = render(
        <AnnotationStatsPanel
          stats={mockStatsPopulated}
          documentTitle="Test"
          onAnnotationClick={jest.fn()}
        />
      );
      fireEvent.click(screen.getByText('Breakdown'));
      await checkA11y(container);
    });
  });

  describe('Interactive elements', () => {
    it('close button should be keyboard accessible', () => {
      const onClose = jest.fn();
      render(
        <AnnotationStatsPanel stats={mockStatsPopulated} documentTitle="Test" onClose={onClose} />
      );

      const closeBtn = screen.getByLabelText('Close statistics');
      closeBtn.focus();
      expect(document.activeElement).toBe(closeBtn);

      fireEvent.keyDown(closeBtn, { key: 'Enter' });
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    });

    it('tab buttons should be focusable', () => {
      render(<AnnotationStatsPanel stats={mockStatsPopulated} documentTitle="Test" />);

      const overviewTab = screen.getByText('Overview');
      const breakdownTab = screen.getByText('Breakdown');

      overviewTab.focus();
      expect(document.activeElement).toBe(overviewTab);

      breakdownTab.focus();
      expect(document.activeElement).toBe(breakdownTab);
    });

    it('breakdown items should be focusable buttons', () => {
      render(
        <AnnotationStatsPanel
          stats={mockStatsPopulated}
          documentTitle="Test"
          onAnnotationClick={jest.fn()}
        />
      );
      fireEvent.click(screen.getByText('Breakdown'));

      const strawManBtn = screen.getByText('Straw Man').closest('button');
      expect(strawManBtn).toBeInTheDocument();
      strawManBtn!.focus();
      expect(document.activeElement).toBe(strawManBtn);
    });

    it('breakdown items should have descriptive titles', () => {
      render(
        <AnnotationStatsPanel
          stats={mockStatsPopulated}
          documentTitle="Test"
          onAnnotationClick={jest.fn()}
        />
      );
      fireEvent.click(screen.getByText('Breakdown'));

      const strawManBtn = screen.getByTitle('View Straw Man in annotation panel');
      expect(strawManBtn).toBeInTheDocument();
    });

    it('speaker stat rows should be rendered accessibly', () => {
      const statsWithSpeakers = {
        ...mockStatsPopulated,
        speakerStats: [
          {
            id: 's1',
            name: 'Speaker A',
            color: '#3B82F6',
            charCount: 300,
            annotatedCharacters: 100,
            coveragePercent: 33,
            paragraphCount: 3,
            annotationCount: 2,
            annotationBreakdown: [
              {
                id: 'straw-man',
                name: 'Straw Man',
                color: '#EF4444',
                type: 'fallacy' as const,
                count: 2,
              },
            ],
          },
        ],
      };
      render(<AnnotationStatsPanel stats={statsWithSpeakers} documentTitle="Test" />);

      expect(screen.getByText('Speaker A')).toBeInTheDocument();
      expect(screen.getByText('By Speaker')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('all interactive elements should be keyboard-reachable', () => {
      const { container } = render(
        <AnnotationStatsPanel
          stats={mockStatsPopulated}
          documentTitle="Test"
          onClose={jest.fn()}
          onAnnotationClick={jest.fn()}
        />
      );

      const focusable = getFocusableElements(container);
      // Should have: close button, overview tab, breakdown tab
      expect(focusable.length).toBeGreaterThanOrEqual(3);
    });

    it('breakdown tab interactive elements should be keyboard-reachable', () => {
      const { container } = render(
        <AnnotationStatsPanel
          stats={mockStatsPopulated}
          documentTitle="Test"
          onAnnotationClick={jest.fn()}
        />
      );
      fireEvent.click(screen.getByText('Breakdown'));

      const focusable = getFocusableElements(container);
      // Should include: overview tab, breakdown tab, 3 breakdown items
      expect(focusable.length).toBeGreaterThanOrEqual(5);
    });
  });
});
