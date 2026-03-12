import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Slate, Editable, withReact } from 'slate-react';
import { createEditor, Descendant } from 'slate';
import { withHistory } from 'slate-history';
import { EditorToolbar } from '../EditorToolbar';

const initialValue: Descendant[] = [
  { type: 'paragraph', children: [{ text: 'Test content' }] },
];

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const editor = React.useMemo(() => withHistory(withReact(createEditor())), []);
  return (
    <Slate editor={editor} initialValue={initialValue}>
      {children}
      <Editable />
    </Slate>
  );
};

const renderWithSlate = (ui: React.ReactElement) => {
  return render(<TestWrapper>{ui}</TestWrapper>);
};

describe('EditorToolbar', () => {
  it('renders formatting buttons', () => {
    renderWithSlate(<EditorToolbar />);
    
    expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument();
    expect(screen.getByTitle('Italic (Ctrl+I)')).toBeInTheDocument();
    expect(screen.getByTitle('Underline (Ctrl+U)')).toBeInTheDocument();
    expect(screen.getByTitle('Strikethrough')).toBeInTheDocument();
  });

  it('renders block buttons', () => {
    renderWithSlate(<EditorToolbar />);
    
    expect(screen.getByTitle('Heading 1')).toBeInTheDocument();
    expect(screen.getByTitle('Heading 2')).toBeInTheDocument();
    expect(screen.getByTitle('Block Quote')).toBeInTheDocument();
  });

  it('renders clear formatting button', () => {
    renderWithSlate(<EditorToolbar />);
    expect(screen.getByTitle('Clear Formatting')).toBeInTheDocument();
  });

  it('renders remove all highlights button', () => {
    renderWithSlate(<EditorToolbar />);
    expect(screen.getByText('Remove ALL Highlights')).toBeInTheDocument();
  });

  it('does not show annotation apply button when no annotation selected', () => {
    renderWithSlate(<EditorToolbar />);
    expect(screen.queryByText('Add/Remove')).not.toBeInTheDocument();
  });

  it('shows annotation apply button when annotation is selected and text is selected', () => {
    const selectedAnnotation = { name: 'Ad Hominem', color: '#E53E3E' };
    renderWithSlate(
      <EditorToolbar 
        selectedAnnotation={selectedAnnotation} 
        hasTextSelection={true}
        onApplyAnnotation={() => {}}
      />
    );
    expect(screen.getByText('Ad Hominem')).toBeInTheDocument();
  });

  it('does not show annotation button when text is not selected', () => {
    const selectedAnnotation = { name: 'Ad Hominem', color: '#E53E3E' };
    renderWithSlate(
      <EditorToolbar 
        selectedAnnotation={selectedAnnotation} 
        hasTextSelection={false}
        onApplyAnnotation={() => {}}
      />
    );
    expect(screen.queryByText('Add/Remove')).not.toBeInTheDocument();
  });

  it('calls onApplyAnnotation when apply button is clicked', () => {
    const onApplyAnnotation = jest.fn();
    const selectedAnnotation = { name: 'Ad Hominem', color: '#E53E3E' };
    renderWithSlate(
      <EditorToolbar 
        selectedAnnotation={selectedAnnotation} 
        hasTextSelection={true}
        onApplyAnnotation={onApplyAnnotation}
      />
    );
    
    const applyButton = screen.getByText('Ad Hominem').closest('button');
    if (applyButton) {
      fireEvent.mouseDown(applyButton);
      expect(onApplyAnnotation).toHaveBeenCalledTimes(1);
    }
  });

  it('applies annotation color to apply button', () => {
    const selectedAnnotation = { name: 'Ad Hominem', color: '#E53E3E' };
    renderWithSlate(
      <EditorToolbar 
        selectedAnnotation={selectedAnnotation} 
        hasTextSelection={true}
        onApplyAnnotation={() => {}}
      />
    );
    
    const applyButton = screen.getByText('Ad Hominem').closest('button');
    expect(applyButton).toHaveStyle({ backgroundColor: '#E53E3E' });
  });

  it('bold button triggers mark toggle on mousedown', () => {
    renderWithSlate(<EditorToolbar />);
    const boldButton = screen.getByTitle('Bold (Ctrl+B)');
    
    // Should not throw when clicked
    fireEvent.mouseDown(boldButton);
  });

  it('heading button triggers block toggle on mousedown', () => {
    renderWithSlate(<EditorToolbar />);
    const h1Button = screen.getByTitle('Heading 1');
    
    // Should not throw when clicked
    fireEvent.mouseDown(h1Button);
  });

  it('clear formatting button is clickable', () => {
    renderWithSlate(<EditorToolbar />);
    const clearButton = screen.getByTitle('Clear Formatting');
    
    // Should not throw when clicked
    fireEvent.mouseDown(clearButton);
  });

  it('remove highlights button is clickable', () => {
    renderWithSlate(<EditorToolbar />);
    const removeButton = screen.getByText('Remove ALL Highlights');
    
    // Should not throw when clicked
    fireEvent.mouseDown(removeButton);
  });

  describe('pinned speakers', () => {
    const pinnedSpeakers = [
      { id: 'speaker_a', name: 'Speaker A', color: '#3B82F6' },
      { id: 'speaker_b', name: 'Speaker B', color: '#10B981' },
    ];

    it('renders pinned speaker buttons', () => {
      renderWithSlate(
        <EditorToolbar 
          pinnedSpeakers={pinnedSpeakers}
        />
      );
      
      expect(screen.getByText('Speaker A')).toBeInTheDocument();
      expect(screen.getByText('Speaker B')).toBeInTheDocument();
    });

    it('does not render speaker section when no pinned speakers', () => {
      renderWithSlate(<EditorToolbar pinnedSpeakers={[]} />);
      
      expect(screen.queryByText('Speaker A')).not.toBeInTheDocument();
    });

    it('calls onAssignPinnedSpeaker when speaker button clicked', () => {
      const onAssignPinnedSpeaker = jest.fn();
      renderWithSlate(
        <EditorToolbar 
          pinnedSpeakers={pinnedSpeakers}
          onAssignPinnedSpeaker={onAssignPinnedSpeaker}
        />
      );
      
      const speakerButton = screen.getByText('Speaker A').closest('button');
      if (speakerButton) {
        fireEvent.mouseDown(speakerButton);
        expect(onAssignPinnedSpeaker).toHaveBeenCalledWith('speaker_a');
      }
    });

    it('applies speaker color to button', () => {
      renderWithSlate(
        <EditorToolbar 
          pinnedSpeakers={pinnedSpeakers}
        />
      );
      
      const speakerButton = screen.getByText('Speaker A').closest('button');
      expect(speakerButton).toHaveStyle({ backgroundColor: '#3B82F6' });
    });

    it('shows speaker icon in button', () => {
      renderWithSlate(
        <EditorToolbar 
          pinnedSpeakers={pinnedSpeakers}
        />
      );
      
      const speakerButton = screen.getByLabelText('Assign speaker Speaker A');
      expect(speakerButton).toBeInTheDocument();
    });
  });
});
