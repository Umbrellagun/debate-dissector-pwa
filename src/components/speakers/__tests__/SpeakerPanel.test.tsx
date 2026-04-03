import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpeakerPanel } from '../SpeakerPanel';
import { Speaker } from '../../../models';
import { AppProvider } from '../../../context';

const mockSpeakers: Speaker[] = [
  { id: 'speaker_a', name: 'Speaker A', color: '#3B82F6' },
  { id: 'speaker_b', name: 'Speaker B', color: '#10B981' },
];

// Custom render wrapper with AppProvider
const customRender = (ui: React.ReactElement) => {
  return render(<AppProvider>{ui}</AppProvider>);
};

describe('SpeakerPanel', () => {
  it('renders the header', () => {
    customRender(<SpeakerPanel speakers={[]} />);
    expect(screen.getByText('Speakers')).toBeInTheDocument();
  });

  it('shows empty state when no speakers', () => {
    customRender(<SpeakerPanel speakers={[]} />);
    expect(screen.getByText('No speakers defined yet.')).toBeInTheDocument();
  });

  it('renders speaker list', () => {
    customRender(<SpeakerPanel speakers={mockSpeakers} />);
    expect(screen.getByText('Speaker A')).toBeInTheDocument();
    expect(screen.getByText('Speaker B')).toBeInTheDocument();
  });

  it('renders "No speaker" option', () => {
    customRender(<SpeakerPanel speakers={mockSpeakers} />);
    expect(screen.getByText('No speaker')).toBeInTheDocument();
  });

  it('shows add speaker button', () => {
    customRender(<SpeakerPanel speakers={[]} />);
    expect(screen.getByTitle('Add speaker')).toBeInTheDocument();
  });

  it('opens add speaker form when add button clicked', () => {
    customRender(<SpeakerPanel speakers={[]} onSpeakerAdd={jest.fn()} />);
    fireEvent.click(screen.getByTitle('Add speaker'));
    expect(screen.getByPlaceholderText('Speaker name...')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onSpeakerAdd when adding a speaker', () => {
    const onSpeakerAdd = jest.fn();
    customRender(<SpeakerPanel speakers={[]} onSpeakerAdd={onSpeakerAdd} />);

    fireEvent.click(screen.getByTitle('Add speaker'));
    fireEvent.change(screen.getByPlaceholderText('Speaker name...'), {
      target: { value: 'New Speaker' },
    });
    fireEvent.click(screen.getByText('Add'));

    expect(onSpeakerAdd).toHaveBeenCalledTimes(1);
    expect(onSpeakerAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Speaker',
      })
    );
  });

  it('cancels add form when cancel clicked', () => {
    customRender(<SpeakerPanel speakers={[]} onSpeakerAdd={jest.fn()} />);

    fireEvent.click(screen.getByTitle('Add speaker'));
    expect(screen.getByPlaceholderText('Speaker name...')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Speaker name...')).not.toBeInTheDocument();
  });

  it('calls onAssignSpeaker when speaker is clicked', () => {
    const onAssignSpeaker = jest.fn();
    customRender(<SpeakerPanel speakers={mockSpeakers} onAssignSpeaker={onAssignSpeaker} />);

    fireEvent.click(screen.getByText('Speaker A'));
    expect(onAssignSpeaker).toHaveBeenCalledWith('speaker_a');
  });

  it('calls onAssignSpeaker with null when "No speaker" clicked', () => {
    const onAssignSpeaker = jest.fn();
    customRender(<SpeakerPanel speakers={mockSpeakers} onAssignSpeaker={onAssignSpeaker} />);

    fireEvent.click(screen.getByText('No speaker'));
    expect(onAssignSpeaker).toHaveBeenCalledWith(null);
  });

  it('calls onSpeakerDelete when delete button clicked', () => {
    const onSpeakerDelete = jest.fn();
    customRender(<SpeakerPanel speakers={mockSpeakers} onSpeakerDelete={onSpeakerDelete} />);

    const deleteButtons = screen.getAllByTitle('Delete speaker');
    fireEvent.click(deleteButtons[0]);
    expect(onSpeakerDelete).toHaveBeenCalledWith('speaker_a');
  });

  it('shows "In use" badge for used speakers', () => {
    customRender(<SpeakerPanel speakers={mockSpeakers} usedSpeakerIds={['speaker_a']} />);

    expect(screen.getByText('In use')).toBeInTheDocument();
  });

  it('shows pin button when onToggleSpeakerPin provided', () => {
    customRender(<SpeakerPanel speakers={mockSpeakers} onToggleSpeakerPin={jest.fn()} />);

    expect(screen.getAllByTitle('Pin to toolbar')).toHaveLength(2);
  });

  it('calls onToggleSpeakerPin when pin button clicked', () => {
    const onToggleSpeakerPin = jest.fn();
    customRender(<SpeakerPanel speakers={mockSpeakers} onToggleSpeakerPin={onToggleSpeakerPin} />);

    fireEvent.click(screen.getAllByTitle('Pin to toolbar')[0]);
    expect(onToggleSpeakerPin).toHaveBeenCalledWith('speaker_a');
  });

  it('shows "Unpin from toolbar" for pinned speakers', () => {
    customRender(
      <SpeakerPanel
        speakers={mockSpeakers}
        pinnedSpeakerIds={['speaker_a']}
        onToggleSpeakerPin={jest.fn()}
      />
    );

    expect(screen.getByTitle('Unpin from toolbar')).toBeInTheDocument();
    expect(screen.getByTitle('Pin to toolbar')).toBeInTheDocument();
  });

  it('shows visibility toggle for used speakers', () => {
    customRender(
      <SpeakerPanel
        speakers={mockSpeakers}
        usedSpeakerIds={['speaker_a']}
        onToggleSpeakerVisibility={jest.fn()}
      />
    );

    expect(screen.getByTitle('Hide paragraphs')).toBeInTheDocument();
  });

  it('calls onToggleSpeakerVisibility when visibility button clicked', () => {
    const onToggleSpeakerVisibility = jest.fn();
    customRender(
      <SpeakerPanel
        speakers={mockSpeakers}
        usedSpeakerIds={['speaker_a']}
        onToggleSpeakerVisibility={onToggleSpeakerVisibility}
      />
    );

    fireEvent.click(screen.getByTitle('Hide paragraphs'));
    expect(onToggleSpeakerVisibility).toHaveBeenCalledWith('speaker_a');
  });

  it('shows "Show paragraphs" for hidden speakers', () => {
    customRender(
      <SpeakerPanel
        speakers={mockSpeakers}
        usedSpeakerIds={['speaker_a']}
        hiddenSpeakerIds={['speaker_a']}
        onToggleSpeakerVisibility={jest.fn()}
      />
    );

    expect(screen.getByTitle('Show paragraphs')).toBeInTheDocument();
  });

  it('opens edit mode when edit button clicked', () => {
    customRender(<SpeakerPanel speakers={mockSpeakers} onSpeakerUpdate={jest.fn()} />);

    const editButtons = screen.getAllByTitle('Edit speaker');
    fireEvent.click(editButtons[0]);

    expect(screen.getByDisplayValue('Speaker A')).toBeInTheDocument();
  });

  it('renders help text', () => {
    customRender(<SpeakerPanel speakers={[]} />);
    expect(
      screen.getByText(
        'Select text or place cursor in a paragraph, then click a speaker to assign.'
      )
    ).toBeInTheDocument();
  });
});
