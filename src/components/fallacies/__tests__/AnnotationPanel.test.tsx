import React from 'react';
import { render, screen, fireEvent } from '../../../test-utils';
import { AnnotationPanel } from '../AnnotationPanel';
import { Fallacy, Rhetoric } from '../../../models';

const mockFallacies: Fallacy[] = [
  {
    id: 'ad-hominem',
    name: 'Ad Hominem',
    category: 'informal',
    description: 'Attacking the person making the argument rather than the argument itself.',
    color: '#E53E3E',
    examples: ['You are wrong because you are stupid.'],
  },
  {
    id: 'straw-man',
    name: 'Straw Man',
    category: 'informal',
    description: 'Misrepresenting an argument to make it easier to attack.',
    color: '#DD6B20',
    examples: ['So you think we should let criminals run free?'],
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
  {
    id: 'pathos',
    name: 'Pathos',
    category: 'pathos',
    description: 'Appeal to emotion.',
    color: '#805AD5',
    examples: ['Think of the children who will suffer.'],
  },
];

describe('AnnotationPanel', () => {
  const defaultProps = {
    fallacies: mockFallacies,
    rhetoric: mockRhetoric,
  };

  it('renders search input', () => {
    render(<AnnotationPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search fallacies & rhetoric...')).toBeInTheDocument();
  });

  it('renders Fallacies and Rhetoric dropdown headers', () => {
    render(<AnnotationPanel {...defaultProps} />);
    expect(screen.getByText('Fallacies')).toBeInTheDocument();
    expect(screen.getByText('Rhetoric')).toBeInTheDocument();
  });

  it('shows dismissible hint by default', () => {
    render(<AnnotationPanel {...defaultProps} />);
    expect(screen.getByText(/Select fallacies or rhetoric/)).toBeInTheDocument();
  });

  it('dismisses hint when clicking dismiss button', () => {
    render(<AnnotationPanel {...defaultProps} />);
    const dismissButton = screen.getByLabelText('Dismiss hint');
    fireEvent.click(dismissButton);
    expect(screen.queryByText(/Select fallacies or rhetoric/)).not.toBeInTheDocument();
  });

  it('toggles Fallacies dropdown when clicked', () => {
    render(<AnnotationPanel {...defaultProps} />);
    const fallaciesButton = screen.getByText('Fallacies');
    
    // Initially expanded by default
    expect(screen.getByText('Ad Hominem')).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(fallaciesButton);
    expect(screen.queryByText('Ad Hominem')).not.toBeInTheDocument();
    
    // Click to expand again
    fireEvent.click(fallaciesButton);
    expect(screen.getByText('Ad Hominem')).toBeInTheDocument();
  });

  it('toggles Rhetoric dropdown when clicked', () => {
    render(<AnnotationPanel {...defaultProps} />);
    const rhetoricButton = screen.getByText('Rhetoric');
    
    // Initially expanded by default
    expect(screen.getByText('Ethos')).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(rhetoricButton);
    expect(screen.queryByText('Ethos')).not.toBeInTheDocument();
  });

  it('filters fallacies based on search query', () => {
    render(<AnnotationPanel {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search fallacies & rhetoric...');
    
    fireEvent.change(searchInput, { target: { value: 'Straw' } });
    
    expect(screen.getByText('Straw Man')).toBeInTheDocument();
    expect(screen.queryByText('Ad Hominem')).not.toBeInTheDocument();
  });

  it('filters rhetoric based on search query', () => {
    render(<AnnotationPanel {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search fallacies & rhetoric...');
    
    fireEvent.change(searchInput, { target: { value: 'emotion' } });
    
    expect(screen.getByText('Pathos')).toBeInTheDocument();
    expect(screen.queryByText('Ethos')).not.toBeInTheDocument();
  });

  it('calls onFallacySelect when fallacy is clicked', () => {
    const onFallacySelect = jest.fn();
    render(<AnnotationPanel {...defaultProps} onFallacySelect={onFallacySelect} />);
    
    fireEvent.click(screen.getByText('Ad Hominem'));
    
    expect(onFallacySelect).toHaveBeenCalledWith(mockFallacies[0]);
  });

  it('calls onRhetoricSelect when rhetoric is clicked', () => {
    const onRhetoricSelect = jest.fn();
    render(<AnnotationPanel {...defaultProps} onRhetoricSelect={onRhetoricSelect} />);
    
    fireEvent.click(screen.getByText('Ethos'));
    
    expect(onRhetoricSelect).toHaveBeenCalledWith(mockRhetoric[0]);
  });

  it('shows fallacy details when selected', () => {
    render(
      <AnnotationPanel 
        {...defaultProps} 
        selectedFallacyId="ad-hominem"
      />
    );
    
    expect(screen.getByText('Attacking the person making the argument rather than the argument itself.')).toBeInTheDocument();
    expect(screen.getByText('Apply/Remove from Selected Text')).toBeInTheDocument();
  });

  it('shows rhetoric details when selected', () => {
    render(
      <AnnotationPanel 
        {...defaultProps} 
        selectedRhetoricId="ethos"
      />
    );
    
    expect(screen.getByText('Appeal to credibility or character.')).toBeInTheDocument();
  });

  it('calls onFallacyApply when apply button is clicked', () => {
    const onFallacyApply = jest.fn();
    render(
      <AnnotationPanel 
        {...defaultProps} 
        selectedFallacyId="ad-hominem"
        onFallacyApply={onFallacyApply}
      />
    );
    
    fireEvent.click(screen.getByText('Apply/Remove from Selected Text'));
    
    expect(onFallacyApply).toHaveBeenCalledWith(mockFallacies[0]);
  });
});
