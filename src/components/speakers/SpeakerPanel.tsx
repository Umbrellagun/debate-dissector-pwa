import React, { useState, useCallback } from 'react';
import { Speaker, DEFAULT_SPEAKER_COLORS } from '../../models';

interface SpeakerPanelProps {
  speakers: Speaker[];
  selectedSpeakerId?: string | null;
  usedSpeakerIds?: string[]; // IDs of speakers actually used in the document
  hiddenSpeakerIds?: string[]; // IDs of speakers whose paragraphs are hidden
  pinnedSpeakerIds?: string[]; // IDs of speakers pinned for quick assignment
  onSpeakerSelect?: (speaker: Speaker | null) => void;
  onSpeakerAdd?: (speaker: Speaker) => void;
  onSpeakerUpdate?: (speaker: Speaker) => void;
  onSpeakerDelete?: (speakerId: string) => void;
  onAssignSpeaker?: (speakerId: string | null) => void;
  onToggleSpeakerVisibility?: (speakerId: string) => void; // Toggle visibility of speaker's paragraphs
  onToggleSpeakerPin?: (speakerId: string) => void; // Toggle pin status for quick assignment
}

// Generate a unique ID for speakers
const generateSpeakerId = (): string => {
  return `speaker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get next available color
const getNextColor = (speakers: Speaker[]): string => {
  const usedColors = new Set(speakers.map(s => s.color));
  for (const color of DEFAULT_SPEAKER_COLORS) {
    if (!usedColors.has(color)) {
      return color;
    }
  }
  // If all colors used, start over
  return DEFAULT_SPEAKER_COLORS[speakers.length % DEFAULT_SPEAKER_COLORS.length];
};

export const SpeakerPanel: React.FC<SpeakerPanelProps> = ({
  speakers,
  selectedSpeakerId,
  usedSpeakerIds = [],
  hiddenSpeakerIds = [],
  pinnedSpeakerIds = [],
  onSpeakerSelect: _onSpeakerSelect,
  onSpeakerAdd,
  onSpeakerUpdate,
  onSpeakerDelete,
  onAssignSpeaker,
  onToggleSpeakerVisibility,
  onToggleSpeakerPin,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAddSpeaker = useCallback(() => {
    if (!newSpeakerName.trim()) return;

    const newSpeaker: Speaker = {
      id: generateSpeakerId(),
      name: newSpeakerName.trim(),
      color: getNextColor(speakers),
    };

    onSpeakerAdd?.(newSpeaker);
    setNewSpeakerName('');
    setIsAdding(false);
  }, [newSpeakerName, speakers, onSpeakerAdd]);

  const handleStartEdit = useCallback((speaker: Speaker) => {
    setEditingSpeakerId(speaker.id);
    setEditingName(speaker.name);
  }, []);

  const handleSaveEdit = useCallback(
    (speaker: Speaker) => {
      if (!editingName.trim()) return;
      onSpeakerUpdate?.({ ...speaker, name: editingName.trim() });
      setEditingSpeakerId(null);
      setEditingName('');
    },
    [editingName, onSpeakerUpdate]
  );

  const handleColorChange = useCallback(
    (speaker: Speaker, color: string) => {
      onSpeakerUpdate?.({ ...speaker, color });
    },
    [onSpeakerUpdate]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-14 px-4 border-b border-gray-200 flex items-center justify-between shrink-0">
        <h3 className="font-medium text-gray-900">Speakers</h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="p-1.5 text-violet-600 hover:bg-violet-50 rounded transition-colors"
            title="Add speaker"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Add Speaker Form */}
      {isAdding && (
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <input
            type="text"
            value={newSpeakerName}
            onChange={e => setNewSpeakerName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddSpeaker();
              if (e.key === 'Escape') {
                setIsAdding(false);
                setNewSpeakerName('');
              }
            }}
            placeholder="Speaker name..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAddSpeaker}
              disabled={!newSpeakerName.trim()}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewSpeakerName('');
              }}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Speaker List */}
      <div className="flex-1 overflow-y-auto">
        {speakers.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p>No speakers defined yet.</p>
            <p className="mt-1">Add speakers to assign them to paragraphs.</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {/* Clear speaker option */}
            <button
              onClick={() => onAssignSpeaker?.(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                selectedSpeakerId === null ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <span className="w-4 h-4 rounded-full border-2 border-dashed border-gray-300" />
              <span className="text-sm text-gray-500 italic">No speaker</span>
            </button>

            {speakers.map(speaker => (
              <div
                key={speaker.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  selectedSpeakerId === speaker.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                {editingSpeakerId === speaker.id ? (
                  // Edit mode
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={speaker.color}
                      onChange={e => handleColorChange(speaker, e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEdit(speaker);
                        if (e.key === 'Escape') setEditingSpeakerId(null);
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(speaker)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setEditingSpeakerId(null)}
                      className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  // View mode
                  <>
                    <button
                      onClick={() => onAssignSpeaker?.(speaker.id)}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 relative"
                        style={{ backgroundColor: speaker.color }}
                      >
                        {usedSpeakerIds.includes(speaker.id) && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white" />
                        )}
                      </span>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {speaker.name}
                      </span>
                      {usedSpeakerIds.includes(speaker.id) && (
                        <span className="text-xs text-green-600 font-medium">In use</span>
                      )}
                    </button>
                    {/* Pin toggle */}
                    {onToggleSpeakerPin && (
                      <button
                        onClick={() => onToggleSpeakerPin(speaker.id)}
                        className={`p-1 rounded transition-colors ${
                          pinnedSpeakerIds.includes(speaker.id)
                            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title={
                          pinnedSpeakerIds.includes(speaker.id)
                            ? 'Unpin from toolbar'
                            : 'Pin to toolbar'
                        }
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill={pinnedSpeakerIds.includes(speaker.id) ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path d="M12 17v5M9 3h6a2 2 0 012 2v4l2 2v2H5v-2l2-2V5a2 2 0 012-2z" />
                        </svg>
                      </button>
                    )}
                    {/* Visibility toggle */}
                    {onToggleSpeakerVisibility && usedSpeakerIds.includes(speaker.id) && (
                      <button
                        onClick={() => onToggleSpeakerVisibility(speaker.id)}
                        className={`p-1 rounded transition-colors ${
                          hiddenSpeakerIds.includes(speaker.id)
                            ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            : 'text-blue-500 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title={
                          hiddenSpeakerIds.includes(speaker.id)
                            ? 'Show paragraphs'
                            : 'Hide paragraphs'
                        }
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {hiddenSpeakerIds.includes(speaker.id) ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          )}
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleStartEdit(speaker)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="Edit speaker"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onSpeakerDelete?.(speaker.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete speaker"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500">
          Select text or place cursor in a paragraph, then click a speaker to assign.
        </p>
      </div>
    </div>
  );
};

export default SpeakerPanel;
