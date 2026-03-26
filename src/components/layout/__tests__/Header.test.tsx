import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../Header';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Header', () => {
  it('renders default title', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText('Debate Dissector')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    renderWithRouter(<Header title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders titleElement when provided', () => {
    renderWithRouter(
      <Header titleElement={<span data-testid="custom-element">Custom Element</span>} />
    );
    expect(screen.getByTestId('custom-element')).toBeInTheDocument();
    expect(screen.queryByText('Debate Dissector')).not.toBeInTheDocument();
  });

  it('renders menu button when onMenuClick is provided', () => {
    const onMenuClick = jest.fn();
    renderWithRouter(<Header onMenuClick={onMenuClick} />);

    const menuButton = screen.getByLabelText('Toggle menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('calls onMenuClick when menu button is clicked', () => {
    const onMenuClick = jest.fn();
    renderWithRouter(<Header onMenuClick={onMenuClick} />);

    fireEvent.click(screen.getByLabelText('Toggle menu'));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('renders back button when onBackClick is provided', () => {
    const onBackClick = jest.fn();
    renderWithRouter(<Header onBackClick={onBackClick} />);

    const backButton = screen.getByLabelText('Go back');
    expect(backButton).toBeInTheDocument();
  });

  it('calls onBackClick when back button is clicked', () => {
    const onBackClick = jest.fn();
    renderWithRouter(<Header onBackClick={onBackClick} />);

    fireEvent.click(screen.getByLabelText('Go back'));
    expect(onBackClick).toHaveBeenCalledTimes(1);
  });

  it('shows back button instead of menu when both are provided', () => {
    const onMenuClick = jest.fn();
    const onBackClick = jest.fn();
    renderWithRouter(<Header onMenuClick={onMenuClick} onBackClick={onBackClick} />);

    expect(screen.getByLabelText('Go back')).toBeInTheDocument();
    expect(screen.queryByLabelText('Toggle menu')).not.toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    renderWithRouter(<Header actions={<button data-testid="action-button">Action</button>} />);
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
  });

  it('does not render menu button when neither handler is provided', () => {
    renderWithRouter(<Header />);
    expect(screen.queryByLabelText('Toggle menu')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Go back')).not.toBeInTheDocument();
  });
});
