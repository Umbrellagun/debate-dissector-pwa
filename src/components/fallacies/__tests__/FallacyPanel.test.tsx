import React from 'react';
import { render, screen, fireEvent } from '../../../test-utils';
import { FallacyPanel } from '../FallacyPanel';
import { Fallacy } from '../../../models';

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
  {
    id: 'appeal-to-authority',
    name: 'Appeal to Authority',
    category: 'formal',
    description: 'Using an authority figure to support a claim without proper justification.',
    color: '#38A169',
    examples: ['Einstein believed in God, so God must exist.'],
  },
  {
    id: 'red-herring',
    name: 'Red Herring',
    category: 'red-herring',
    description: 'Introducing an irrelevant topic to divert attention.',
    color: '#D69E2E',
    examples: ['Why worry about climate change when there are hungry children?'],
  },
];

describe('FallacyPanel', () => {
  const defaultProps = {
    fallacies: mockFallacies,
  };

  it('renders category headers', () => {
    render(<FallacyPanel {...defaultProps} />);
    expect(screen.getByText('Informal Fallacies')).toBeInTheDocument();
    expect(screen.getByText('Formal Fallacies')).toBeInTheDocument();
    expect(screen.getByText('Red Herrings')).toBeInTheDocument();
  });

  it('toggles category expansion when clicked', () => {
    render(<FallacyPanel {...defaultProps} />);
    const formalCategory = screen.getByText('Formal Fallacies');
    
    // Formal is not expanded by default
    expect(screen.queryByText('Appeal to Authority')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(formalCategory);
    expect(screen.getByText('Appeal to Authority')).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(formalCategory);
    expect(screen.queryByText('Appeal to Authority')).not.toBeInTheDocument();
  });

  it('shows fallacies in expanded categories', () => {
    render(<FallacyPanel {...defaultProps} />);
    
    // Informal and Red Herring are expanded by default
    expect(screen.getByText('Ad Hominem')).toBeInTheDocument();
    expect(screen.getByText('Straw Man')).toBeInTheDocument();
    expect(screen.getByText('Red Herring')).toBeInTheDocument();
  });

  it('calls onFallacySelect when fallacy button is clicked', () => {
    const onFallacySelect = jest.fn();
    render(<FallacyPanel {...defaultProps} onFallacySelect={onFallacySelect} />);
    
    fireEvent.click(screen.getByText('Ad Hominem'));
    
    expect(onFallacySelect).toHaveBeenCalledWith(mockFallacies[0]);
  });

  it('highlights selected fallacy', () => {
    render(<FallacyPanel {...defaultProps} selectedFallacyId="ad-hominem" />);
    
    const fallacyButton = screen.getByText('Ad Hominem').closest('button');
    expect(fallacyButton).toHaveClass('bg-blue-50');
  });

  it('filters fallacies based on search query', () => {
    render(<FallacyPanel {...defaultProps} searchQuery="Straw" />);
    
    expect(screen.getByText('Straw Man')).toBeInTheDocument();
    expect(screen.queryByText('Ad Hominem')).not.toBeInTheDocument();
  });

  it('filters by description as well as name', () => {
    render(<FallacyPanel {...defaultProps} searchQuery="Misrepresenting" />);
    
    expect(screen.getByText('Straw Man')).toBeInTheDocument();
    expect(screen.queryByText('Ad Hominem')).not.toBeInTheDocument();
  });

  it('shows internal search when no external searchQuery provided', () => {
    render(<FallacyPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search fallacies...')).toBeInTheDocument();
  });

  it('hides internal search when external searchQuery provided', () => {
    render(<FallacyPanel {...defaultProps} searchQuery="" />);
    expect(screen.queryByPlaceholderText('Search fallacies...')).not.toBeInTheDocument();
  });

  it('displays fallacy color indicators', () => {
    render(<FallacyPanel {...defaultProps} />);
    
    // Check that colored indicators are present
    const adHominemButton = screen.getByText('Ad Hominem').closest('button');
    const colorIndicator = adHominemButton?.querySelector('span');
    expect(colorIndicator).toHaveStyle({ backgroundColor: '#E53E3E' });
  });
});
