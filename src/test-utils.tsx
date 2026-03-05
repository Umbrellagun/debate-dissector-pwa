import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { AppProvider } from './context';

expect.extend(toHaveNoViolations);

interface WrapperProps {
  children: React.ReactNode;
}

const AllTheProviders: React.FC<WrapperProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <AppProvider>
        {children}
      </AppProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Accessibility testing utilities
export const axe = configureAxe({
  rules: {
    'color-contrast': { enabled: true },
    'document-title': { enabled: false },
    'html-has-lang': { enabled: false },
    'landmark-one-main': { enabled: false },
    'page-has-heading-one': { enabled: false },
    region: { enabled: false },
  },
});

export async function checkA11y(container: Element) {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

export function getFocusableElements(container: Element): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors));
}

export function checkAriaLabels(container: Element): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  const buttons = container.querySelectorAll('button');
  buttons.forEach((button, index) => {
    const hasLabel =
      button.textContent?.trim() ||
      button.getAttribute('aria-label') ||
      button.getAttribute('aria-labelledby') ||
      button.getAttribute('title');
    
    if (!hasLabel) {
      issues.push(`Button ${index + 1} has no accessible name`);
    }
  });

  const inputs = container.querySelectorAll('input, textarea, select');
  inputs.forEach((input, index) => {
    const id = input.getAttribute('id');
    const hasLabel =
      input.getAttribute('aria-label') ||
      input.getAttribute('aria-labelledby') ||
      input.getAttribute('placeholder') ||
      (id && container.querySelector(`label[for="${id}"]`));
    
    if (!hasLabel) {
      issues.push(`Input ${index + 1} has no accessible label`);
    }
  });

  return { valid: issues.length === 0, issues };
}

export * from '@testing-library/react';
export { customRender as render };
