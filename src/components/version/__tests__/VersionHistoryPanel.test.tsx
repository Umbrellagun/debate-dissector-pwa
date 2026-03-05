import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VersionHistoryPanel } from '../VersionHistoryPanel';
import { DocumentVersion } from '../../../models';
import * as storage from '../../../services/storage';

jest.mock('../../../services/storage', () => ({
  getVersions: jest.fn(),
  deleteVersion: jest.fn(),
}));

const mockVersions: DocumentVersion[] = [
  {
    id: 'version-1',
    documentId: 'doc-1',
    title: 'First Version',
    content: [{ type: 'paragraph', children: [{ text: 'Hello world' }] }],
    annotations: {},
    timestamp: Date.now() - 60000, // 1 minute ago
    label: 'Auto-save',
  },
  {
    id: 'version-2',
    documentId: 'doc-1',
    title: 'Second Version',
    content: [{ type: 'paragraph', children: [{ text: 'Updated content here' }] }],
    annotations: {},
    timestamp: Date.now() - 3600000, // 1 hour ago
  },
];

describe('VersionHistoryPanel', () => {
  const defaultProps = {
    documentId: 'doc-1',
    onRestore: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getVersions as jest.Mock).mockResolvedValue(mockVersions);
    (storage.deleteVersion as jest.Mock).mockResolvedValue(undefined);
    window.confirm = jest.fn(() => true);
  });

  it('renders header with title', async () => {
    render(<VersionHistoryPanel {...defaultProps} />);
    expect(screen.getByText('Version History')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<VersionHistoryPanel {...defaultProps} />);
    // Loading spinner should be present initially
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('loads and displays versions', async () => {
    render(<VersionHistoryPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('First Version')).toBeInTheDocument();
      expect(screen.getByText('Second Version')).toBeInTheDocument();
    });
  });

  it('shows empty state when no versions exist', async () => {
    (storage.getVersions as jest.Mock).mockResolvedValue([]);
    render(<VersionHistoryPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('No version history yet')).toBeInTheDocument();
    });
  });

  it('displays version labels when present', async () => {
    render(<VersionHistoryPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Auto-save')).toBeInTheDocument();
    });
  });

  it('shows relative time for recent versions', async () => {
    render(<VersionHistoryPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('1 min ago')).toBeInTheDocument();
      expect(screen.getByText('1 hour ago')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    render(<VersionHistoryPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('First Version')).toBeInTheDocument();
    });

    const closeButton = document.querySelector('button[class*="hover:bg-gray-100"]');
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onRestore when restore button is clicked', async () => {
    render(<VersionHistoryPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('First Version')).toBeInTheDocument();
    });

    const restoreButtons = screen.getAllByTitle('Restore this version');
    fireEvent.click(restoreButtons[0]);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(defaultProps.onRestore).toHaveBeenCalledWith(mockVersions[0]);
  });

  it('does not restore if confirm is cancelled', async () => {
    window.confirm = jest.fn(() => false);
    render(<VersionHistoryPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('First Version')).toBeInTheDocument();
    });

    const restoreButtons = screen.getAllByTitle('Restore this version');
    fireEvent.click(restoreButtons[0]);
    
    expect(defaultProps.onRestore).not.toHaveBeenCalled();
  });

  it('calls deleteVersion when delete button is clicked', async () => {
    render(<VersionHistoryPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('First Version')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete this version');
    fireEvent.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(storage.deleteVersion).toHaveBeenCalledWith('version-1');
  });

  it('does not delete if confirm is cancelled', async () => {
    window.confirm = jest.fn(() => false);
    render(<VersionHistoryPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('First Version')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete this version');
    fireEvent.click(deleteButtons[0]);
    
    expect(storage.deleteVersion).not.toHaveBeenCalled();
  });

  it('extracts preview text from version content', async () => {
    render(<VersionHistoryPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Hello world')).toBeInTheDocument();
      expect(screen.getByText('Updated content here')).toBeInTheDocument();
    });
  });

  it('shows footer info about auto-save', async () => {
    render(<VersionHistoryPanel {...defaultProps} />);
    expect(screen.getByText(/Versions are automatically saved/)).toBeInTheDocument();
  });

  it('highlights selected version', async () => {
    render(<VersionHistoryPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('First Version')).toBeInTheDocument();
    });

    const versionItem = screen.getByText('First Version').closest('div[class*="rounded-lg"]');
    if (versionItem) {
      fireEvent.click(versionItem);
      expect(versionItem).toHaveClass('border-blue-500');
    }
  });
});
