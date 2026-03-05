import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DebateList } from '../DebateList';
import { DocumentListItem } from '../../../models';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockDocuments: DocumentListItem[] = [
  {
    id: 'doc-1',
    title: 'First Debate',
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 3600000, // 1 hour ago
    preview: 'This is a preview of the first debate...',
    annotationCount: 3,
  },
  {
    id: 'doc-2',
    title: 'Second Debate',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 86400000, // 1 day ago
    preview: 'This is a preview of the second debate...',
    annotationCount: 0,
  },
  {
    id: 'doc-3',
    title: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    preview: '',
    annotationCount: 1,
  },
];

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('DebateList', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders empty state when no documents', () => {
    renderWithRouter(<DebateList documents={[]} />);
    expect(screen.getByText('No debates yet')).toBeInTheDocument();
    expect(screen.getByText(/Get started by creating a new debate/)).toBeInTheDocument();
  });

  it('renders list of documents', () => {
    renderWithRouter(<DebateList documents={mockDocuments} />);
    expect(screen.getByText('First Debate')).toBeInTheDocument();
    expect(screen.getByText('Second Debate')).toBeInTheDocument();
  });

  it('shows "Untitled" for documents without title', () => {
    renderWithRouter(<DebateList documents={mockDocuments} />);
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('displays annotation count badge when annotations exist', () => {
    renderWithRouter(<DebateList documents={mockDocuments} />);
    expect(screen.getByText('3 annotations')).toBeInTheDocument();
    expect(screen.getByText('1 annotation')).toBeInTheDocument();
  });

  it('does not show annotation badge when count is 0', () => {
    renderWithRouter(<DebateList documents={mockDocuments} />);
    expect(screen.queryByText('0 annotation')).not.toBeInTheDocument();
  });

  it('navigates to editor when document is clicked', () => {
    renderWithRouter(<DebateList documents={mockDocuments} />);
    fireEvent.click(screen.getByText('First Debate'));
    expect(mockNavigate).toHaveBeenCalledWith('/editor/doc-1');
  });

  it('shows delete button when onDelete is provided', () => {
    const onDelete = jest.fn();
    renderWithRouter(<DebateList documents={mockDocuments} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByTitle('Delete');
    expect(deleteButtons.length).toBe(3);
  });

  it('does not show delete button when onDelete is not provided', () => {
    renderWithRouter(<DebateList documents={mockDocuments} />);
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
  });

  it('calls onDelete with correct id when delete button is clicked', () => {
    const onDelete = jest.fn();
    renderWithRouter(<DebateList documents={mockDocuments} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith('doc-1');
  });

  it('stops event propagation when delete is clicked', () => {
    const onDelete = jest.fn();
    renderWithRouter(<DebateList documents={mockDocuments} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('formats dates correctly', () => {
    renderWithRouter(<DebateList documents={mockDocuments} />);
    // Just verify dates are rendered (exact format depends on locale)
    const dateElements = screen.getAllByText(/\d{4}|\d{1,2}:\d{2}/);
    expect(dateElements.length).toBeGreaterThan(0);
  });
});
