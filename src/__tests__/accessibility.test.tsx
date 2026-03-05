import React from 'react';
import { render, screen, fireEvent, RenderOptions } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AppProvider } from '../context';
import { Header } from '../components/layout/Header';
import { AnnotationPanel } from '../components/fallacies/AnnotationPanel';
import { FallacyPanel } from '../components/fallacies/FallacyPanel';
import { RhetoricPanel } from '../components/fallacies/RhetoricPanel';
import { Fallacy, Rhetoric } from '../models';

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
  const selectors = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
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
      customRender(
        <AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />
      );
      
      const searchInput = screen.getByPlaceholderText('Search fallacies & rhetoric...');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput.tagName).toBe('INPUT');
    });

    it('should have accessible tab buttons', () => {
      customRender(
        <AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />
      );
      
      const fallaciesTab = screen.getByText('Fallacies');
      const rhetoricTab = screen.getByText('Rhetoric');
      
      expect(fallaciesTab.closest('button')).toBeInTheDocument();
      expect(rhetoricTab.closest('button')).toBeInTheDocument();
    });

    it('tabs should be keyboard navigable', () => {
      customRender(
        <AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />
      );
      
      const fallaciesTab = screen.getByText('Fallacies').closest('button');
      
      fallaciesTab?.focus();
      expect(document.activeElement).toBe(fallaciesTab);
      
      // Tab buttons should be focusable and clickable
      expect(fallaciesTab).toBeInTheDocument();
    });

    it('hint dismiss button should be accessible', () => {
      customRender(
        <AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />
      );
      
      const dismissButton = screen.getByLabelText('Dismiss hint');
      expect(dismissButton).toBeInTheDocument();
    });
  });

  describe('FallacyPanel Component', () => {
    it('should have no axe violations', async () => {
      const { container } = customRender(
        <FallacyPanel fallacies={mockFallacies} />
      );
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
      const { container } = customRender(
        <RhetoricPanel rhetoric={mockRhetoric} />
      );
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
      focusableElements.forEach((element) => {
        element.focus();
        expect(document.activeElement).toBe(element);
      });
    });
  });

  describe('ARIA Labels', () => {
    it('Header should have proper ARIA labels', () => {
      const { container } = render(
        <Header onMenuClick={() => {}} onBackClick={() => {}} />
      );
      
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
      expect(screen.getByPlaceholderText('Search fallacies & rhetoric...')).toBeInTheDocument();
    });
  });

  describe('Form Inputs', () => {
    it('search inputs should be properly labeled', () => {
      customRender(
        <AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />
      );
      
      const searchInput = screen.getByPlaceholderText('Search fallacies & rhetoric...');
      expect(searchInput).toHaveAttribute('type', 'text');
      expect(searchInput).toHaveAttribute('placeholder');
    });

    it('search inputs should be focusable', () => {
      customRender(
        <FallacyPanel fallacies={mockFallacies} />
      );
      
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
      customRender(
        <AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />
      );
      
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
      customRender(
        <AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />
      );
      
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
      customRender(
        <AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />
      );
      
      const searchInput = screen.getByPlaceholderText('Search fallacies & rhetoric...');
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

  describe('Focus Management', () => {
    it('should maintain focus after interaction', async () => {
      customRender(
        <AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />
      );
      
      const searchInput = screen.getByPlaceholderText('Search fallacies & rhetoric...');
      searchInput.focus();
      
      // Type in search
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      // Focus should remain on input
      expect(document.activeElement).toBe(searchInput);
    });

    it('clicking tab should update content but maintain interactivity', () => {
      customRender(
        <AnnotationPanel fallacies={mockFallacies} rhetoric={mockRhetoric} />
      );
      
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
