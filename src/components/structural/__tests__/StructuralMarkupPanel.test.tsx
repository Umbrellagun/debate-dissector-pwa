import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StructuralMarkupPanel } from '../StructuralMarkupPanel';

describe('StructuralMarkupPanel', () => {
  it('renders the header', () => {
    render(<StructuralMarkupPanel />);
    expect(screen.getByText('Claims & Evidence')).toBeInTheDocument();
  });

  it('renders category headers', () => {
    render(<StructuralMarkupPanel />);
    expect(screen.getByText('Assertions')).toBeInTheDocument();
    expect(screen.getByText('Supporting Evidence')).toBeInTheDocument();
  });

  it('renders all markup items by default (categories expanded)', () => {
    render(<StructuralMarkupPanel />);
    expect(screen.getByText('Claim')).toBeInTheDocument();
    expect(screen.getByText('Evidence')).toBeInTheDocument();
    expect(screen.getByText('Unsupported Claim')).toBeInTheDocument();
    expect(screen.getByText('Statistic')).toBeInTheDocument();
    expect(screen.getByText('Quote')).toBeInTheDocument();
    expect(screen.getByText('Anecdote')).toBeInTheDocument();
  });

  it('toggles category when header is clicked', () => {
    render(<StructuralMarkupPanel />);
    const assertionsButton = screen.getByText('Assertions');

    // Initially expanded
    expect(screen.getByText('Claim')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(assertionsButton);
    expect(screen.queryByText('Claim')).not.toBeInTheDocument();

    // Click to expand again
    fireEvent.click(assertionsButton);
    expect(screen.getByText('Claim')).toBeInTheDocument();
  });

  it('calls onMarkupSelect when a markup item is clicked', () => {
    const onMarkupSelect = jest.fn();
    render(<StructuralMarkupPanel onMarkupSelect={onMarkupSelect} />);

    fireEvent.click(screen.getByText('Evidence'));

    expect(onMarkupSelect).toHaveBeenCalledTimes(1);
    expect(onMarkupSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'evidence', name: 'Evidence' })
    );
  });

  it('shows "Applied" badge for applied markups', () => {
    render(<StructuralMarkupPanel appliedMarkupIds={['claim']} />);
    expect(screen.getByText('Applied')).toBeInTheDocument();
  });

  it('does not show "Applied" badge for unapplied markups', () => {
    render(<StructuralMarkupPanel appliedMarkupIds={[]} />);
    expect(screen.queryByText('Applied')).not.toBeInTheDocument();
  });

  it('shows total markup count when stats are provided', () => {
    render(<StructuralMarkupPanel markupStats={{ claim: 3, evidence: 2 }} />);
    expect(screen.getByText('5 total')).toBeInTheDocument();
  });

  it('shows per-markup counts when stats are provided', () => {
    render(<StructuralMarkupPanel markupStats={{ claim: 3, evidence: 2 }} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows warning summary when unsupported claims exist', () => {
    render(<StructuralMarkupPanel markupStats={{ unsupported: 2 }} />);
    expect(screen.getByText('Attention Needed')).toBeInTheDocument();
    expect(screen.getByText(/2 unsupported assertions/)).toBeInTheDocument();
  });

  it('does not show warning summary when no warnings exist', () => {
    render(<StructuralMarkupPanel markupStats={{ claim: 1 }} />);
    expect(screen.queryByText('Attention Needed')).not.toBeInTheDocument();
  });

  describe('selected markup detail', () => {
    it('shows detail panel when a markup is selected', () => {
      render(<StructuralMarkupPanel selectedMarkupId="claim" />);
      expect(screen.getByText('A statement or assertion being made that may require evidence.')).toBeInTheDocument();
    });

    it('shows apply button disabled when no selection', () => {
      render(<StructuralMarkupPanel selectedMarkupId="claim" hasSelection={false} />);
      expect(screen.getByText('Select text to apply')).toBeInTheDocument();
      expect(screen.getByText('Select text to apply')).toBeDisabled();
    });

    it('shows "Apply Markup" when text is selected and markup is not applied', () => {
      render(
        <StructuralMarkupPanel 
          selectedMarkupId="claim" 
          hasSelection={true} 
          appliedMarkupIds={[]} 
        />
      );
      expect(screen.getByText('Apply Markup')).toBeInTheDocument();
      expect(screen.getByText('Apply Markup')).toBeEnabled();
    });

    it('shows "Remove Markup" when text is selected and markup is already applied', () => {
      render(
        <StructuralMarkupPanel 
          selectedMarkupId="claim" 
          hasSelection={true} 
          appliedMarkupIds={['claim']} 
        />
      );
      expect(screen.getByText('Remove Markup')).toBeInTheDocument();
    });

    it('calls onApplyMarkup when apply button is clicked', () => {
      const onApplyMarkup = jest.fn();
      render(
        <StructuralMarkupPanel 
          selectedMarkupId="evidence" 
          hasSelection={true} 
          onApplyMarkup={onApplyMarkup} 
        />
      );

      fireEvent.click(screen.getByText('Apply Markup'));

      expect(onApplyMarkup).toHaveBeenCalledTimes(1);
      expect(onApplyMarkup).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'evidence' }),
        undefined
      );
    });

    it('has close button on detail panel', () => {
      render(<StructuralMarkupPanel selectedMarkupId="claim" />);
      expect(screen.getByLabelText('Close details')).toBeInTheDocument();
    });
  });

  describe('citation form for citable markups', () => {
    it('shows citation toggle for evidence', () => {
      render(<StructuralMarkupPanel selectedMarkupId="evidence" />);
      expect(screen.getByText('Add source citation')).toBeInTheDocument();
    });

    it('shows citation toggle for statistic', () => {
      render(<StructuralMarkupPanel selectedMarkupId="statistic" />);
      expect(screen.getByText('Add source citation')).toBeInTheDocument();
    });

    it('shows citation toggle for quote', () => {
      render(<StructuralMarkupPanel selectedMarkupId="quote" />);
      expect(screen.getByText('Add source citation')).toBeInTheDocument();
    });

    it('does not show citation toggle for claim', () => {
      render(<StructuralMarkupPanel selectedMarkupId="claim" />);
      expect(screen.queryByText('Add source citation')).not.toBeInTheDocument();
    });

    it('does not show citation toggle for unsupported', () => {
      render(<StructuralMarkupPanel selectedMarkupId="unsupported" />);
      expect(screen.queryByText('Add source citation')).not.toBeInTheDocument();
    });

    it('expands citation form when toggle is clicked', () => {
      render(<StructuralMarkupPanel selectedMarkupId="evidence" />);

      fireEvent.click(screen.getByText('Add source citation'));

      expect(screen.getByPlaceholderText('Source URL')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Author')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Publication')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Date')).toBeInTheDocument();
    });

    it('shows verification status buttons in citation form', () => {
      render(<StructuralMarkupPanel selectedMarkupId="evidence" />);

      fireEvent.click(screen.getByText('Add source citation'));

      expect(screen.getByText(/Unverified/)).toBeInTheDocument();
      expect(screen.getByText(/Verified/)).toBeInTheDocument();
      expect(screen.getByText(/Disputed/)).toBeInTheDocument();
    });

    it('passes citation data when applying with source info', () => {
      const onApplyMarkup = jest.fn();
      render(
        <StructuralMarkupPanel 
          selectedMarkupId="evidence" 
          hasSelection={true} 
          onApplyMarkup={onApplyMarkup} 
        />
      );

      // Open citation form
      fireEvent.click(screen.getByText('Add source citation'));

      // Fill in source URL
      fireEvent.change(screen.getByPlaceholderText('Source URL'), {
        target: { value: 'https://example.com' },
      });

      // Apply
      fireEvent.click(screen.getByText('Apply Markup'));

      expect(onApplyMarkup).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'evidence' }),
        expect.objectContaining({ url: 'https://example.com' })
      );
    });
  });

  it('renders help text', () => {
    render(<StructuralMarkupPanel />);
    expect(screen.getByText(/Select text to mark claims/)).toBeInTheDocument();
  });

  it('renders keyboard shortcut hints', () => {
    render(<StructuralMarkupPanel />);
    expect(screen.getByText(/Shortcuts:/)).toBeInTheDocument();
  });
});
