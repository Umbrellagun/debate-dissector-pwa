import React from 'react';
import { render, screen, fireEvent } from '../../../test-utils';
import { RhetoricPanel } from '../RhetoricPanel';
import { Rhetoric } from '../../../models';

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
  {
    id: 'logos',
    name: 'Logos',
    category: 'logos',
    description: 'Appeal to logic and reason.',
    color: '#38A169',
    examples: ['Statistics show that 80% of users prefer this option.'],
  },
  {
    id: 'kairos-example',
    name: 'Kairos Example',
    category: 'kairos',
    description: 'Appeal to timing and opportunity.',
    color: '#D69E2E',
    examples: ['Now is the time to act.'],
  },
];

describe('RhetoricPanel', () => {
  const defaultProps = {
    rhetoric: mockRhetoric,
  };

  it('renders category headers', () => {
    render(<RhetoricPanel {...defaultProps} />);
    expect(screen.getByText('Ethos (Credibility)')).toBeInTheDocument();
    expect(screen.getByText('Pathos (Emotional)')).toBeInTheDocument();
    expect(screen.getByText('Logos (Logical)')).toBeInTheDocument();
    expect(screen.getByText('Kairos (Timing)')).toBeInTheDocument();
  });

  it('toggles category expansion when clicked', () => {
    render(<RhetoricPanel {...defaultProps} />);
    const kairosCategory = screen.getByText('Kairos (Timing)');
    
    // Kairos is not expanded by default
    expect(screen.queryByText('Kairos Example')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(kairosCategory);
    expect(screen.getByText('Kairos Example')).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(kairosCategory);
    expect(screen.queryByText('Kairos Example')).not.toBeInTheDocument();
  });

  it('shows rhetoric in expanded categories', () => {
    render(<RhetoricPanel {...defaultProps} />);
    
    // Ethos category is expanded by default
    expect(screen.getByText('Ethos')).toBeInTheDocument();
  });

  it('calls onRhetoricSelect when rhetoric button is clicked', () => {
    const onRhetoricSelect = jest.fn();
    render(<RhetoricPanel {...defaultProps} onRhetoricSelect={onRhetoricSelect} />);
    
    fireEvent.click(screen.getByText('Ethos'));
    
    expect(onRhetoricSelect).toHaveBeenCalledWith(mockRhetoric[0]);
  });

  it('highlights selected rhetoric', () => {
    render(<RhetoricPanel {...defaultProps} selectedRhetoricId="ethos" />);
    
    const rhetoricButton = screen.getByText('Ethos').closest('button');
    expect(rhetoricButton).toHaveClass('bg-blue-50');
  });

  it('filters rhetoric based on search query', () => {
    render(<RhetoricPanel {...defaultProps} searchQuery="emotion" />);
    
    expect(screen.getByText('Pathos')).toBeInTheDocument();
    expect(screen.queryByText('Ethos')).not.toBeInTheDocument();
    expect(screen.queryByText('Logos')).not.toBeInTheDocument();
  });

  it('filters by name as well as description', () => {
    render(<RhetoricPanel {...defaultProps} searchQuery="Logos" />);
    
    expect(screen.getByText('Logos')).toBeInTheDocument();
    expect(screen.queryByText('Ethos')).not.toBeInTheDocument();
  });

  it('shows internal search when no external searchQuery provided', () => {
    render(<RhetoricPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search rhetoric...')).toBeInTheDocument();
  });

  it('hides internal search when external searchQuery provided', () => {
    render(<RhetoricPanel {...defaultProps} searchQuery="" />);
    expect(screen.queryByPlaceholderText('Search rhetoric...')).not.toBeInTheDocument();
  });

  it('displays rhetoric color indicators', () => {
    render(<RhetoricPanel {...defaultProps} />);
    
    const ethosButton = screen.getByText('Ethos').closest('button');
    const colorIndicator = ethosButton?.querySelector('span');
    expect(colorIndicator).toHaveStyle({ backgroundColor: '#3182CE' });
  });
});
