import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Descendant } from 'slate';
import { ArgumentMapView } from '../ArgumentMapView';
import { Speaker, ArgumentLink } from '../../../models/document';

// --- Test data ---

const makeFallacyMark = (id: string, fallacyId: string) => ({
  id,
  fallacyId,
  color: '#EF4444',
  appliedAt: Date.now(),
});

const makeRhetoricMark = (id: string, rhetoricId: string) => ({
  id,
  rhetoricId,
  color: '#3B82F6',
  appliedAt: Date.now(),
});

const makeStructuralMark = (id: string, markupId: string) => ({
  id,
  markupId,
  color: '#8B5CF6',
  appliedAt: Date.now(),
});

const emptyContent: Descendant[] = [{ type: 'paragraph', children: [{ text: 'No markup here' }] }];

const singleFallacyContent: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'This is a straw man argument.',
        fallacyMarks: [makeFallacyMark('fm-1', 'straw-man')],
      },
    ],
  },
];

const multiFallacyContent: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'This is a straw man argument.',
        fallacyMarks: [makeFallacyMark('fm-1', 'straw-man')],
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: 'This is ad hominem.',
        fallacyMarks: [makeFallacyMark('fm-2', 'ad-hominem')],
      },
    ],
  },
];

const mixedMarkupContent: Descendant[] = [
  {
    type: 'paragraph',
    speakerId: 'spk-1',
    children: [
      {
        text: 'A claim with evidence.',
        structuralMarks: [makeStructuralMark('sm-1', 'claim')],
      },
    ],
  } as Descendant,
  {
    type: 'paragraph',
    speakerId: 'spk-2',
    children: [
      {
        text: 'Using emotional appeal here.',
        rhetoricMarks: [makeRhetoricMark('rm-1', 'appeal-to-emotion')],
      },
    ],
  } as Descendant,
  {
    type: 'paragraph',
    speakerId: 'spk-1',
    children: [
      {
        text: 'That is a red herring.',
        fallacyMarks: [makeFallacyMark('fm-3', 'red-herring')],
      },
    ],
  } as Descendant,
];

const speakers: Speaker[] = [
  { id: 'spk-1', name: 'Alice', color: '#3B82F6' },
  { id: 'spk-2', name: 'Bob', color: '#EF4444' },
];

const argumentLinks: ArgumentLink[] = [
  {
    id: 'link-1',
    sourceMarkId: 'fm-3',
    targetMarkId: 'sm-1',
    createdAt: Date.now(),
  },
];

// --- Tests ---

describe('ArgumentMapView', () => {
  describe('empty state', () => {
    it('shows empty message when no markups exist', () => {
      render(<ArgumentMapView content={emptyContent} />);
      expect(screen.getByText('No markups found')).toBeInTheDocument();
      expect(screen.getByText(/Switch back to the editor and annotate text/)).toBeInTheDocument();
    });
  });

  describe('block extraction', () => {
    it('renders a single fallacy block', () => {
      render(<ArgumentMapView content={singleFallacyContent} />);
      expect(screen.getByText('This is a straw man argument.')).toBeInTheDocument();
      expect(screen.getByText('1 marked passage')).toBeInTheDocument();
    });

    it('renders multiple fallacy blocks', () => {
      render(<ArgumentMapView content={multiFallacyContent} />);
      expect(screen.getByText('This is a straw man argument.')).toBeInTheDocument();
      expect(screen.getByText('This is ad hominem.')).toBeInTheDocument();
      expect(screen.getByText('2 marked passages')).toBeInTheDocument();
    });

    it('renders mixed markup types with correct summary counts', () => {
      render(<ArgumentMapView content={mixedMarkupContent} speakers={speakers} />);
      expect(screen.getByText('A claim with evidence.')).toBeInTheDocument();
      expect(screen.getByText('Using emotional appeal here.')).toBeInTheDocument();
      expect(screen.getByText('That is a red herring.')).toBeInTheDocument();
      expect(screen.getByText('3 marked passages')).toBeInTheDocument();
    });
  });

  describe('speaker badges', () => {
    it('shows speaker names on blocks when speakers are provided', () => {
      render(<ArgumentMapView content={mixedMarkupContent} speakers={speakers} />);
      const aliceBadges = screen.getAllByText('Alice');
      const bobBadges = screen.getAllByText('Bob');
      expect(aliceBadges.length).toBe(2); // Alice has 2 blocks
      expect(bobBadges.length).toBe(1); // Bob has 1 block
    });
  });

  describe('linking', () => {
    it('shows connect buttons when onCreateLink is provided', () => {
      render(
        <ArgumentMapView
          content={multiFallacyContent}
          onCreateLink={jest.fn()}
          onDeleteLink={jest.fn()}
        />
      );
      const connectButtons = screen.getAllByTitle('Connect to another block');
      expect(connectButtons.length).toBe(2);
    });

    it('does not show connect buttons when onCreateLink is not provided', () => {
      render(<ArgumentMapView content={multiFallacyContent} />);
      expect(screen.queryByTitle('Connect to another block')).not.toBeInTheDocument();
    });

    it('enters linking mode when connect button is clicked', () => {
      render(
        <ArgumentMapView
          content={multiFallacyContent}
          onCreateLink={jest.fn()}
          onDeleteLink={jest.fn()}
        />
      );
      const connectButtons = screen.getAllByTitle('Connect to another block');
      fireEvent.click(connectButtons[0]);
      expect(screen.getByText('Click a target block…')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('cancels linking mode when Cancel is clicked', () => {
      render(
        <ArgumentMapView
          content={multiFallacyContent}
          onCreateLink={jest.fn()}
          onDeleteLink={jest.fn()}
        />
      );
      const connectButtons = screen.getAllByTitle('Connect to another block');
      fireEvent.click(connectButtons[0]);
      expect(screen.getByText('Click a target block…')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Click a target block…')).not.toBeInTheDocument();
    });
  });

  describe('link badges', () => {
    it('shows link badges on linked blocks', () => {
      render(
        <ArgumentMapView
          content={mixedMarkupContent}
          speakers={speakers}
          argumentLinks={argumentLinks}
          onCreateLink={jest.fn()}
          onDeleteLink={jest.fn()}
        />
      );
      // The source block (fm-3, "That is a red herring") should show an outgoing badge
      // The target block (sm-1, "A claim with evidence") should show an incoming badge
      const outgoingBadges = screen.getAllByText(/→/);
      const incomingBadges = screen.getAllByText(/←/);
      expect(outgoingBadges.length).toBeGreaterThan(0);
      expect(incomingBadges.length).toBeGreaterThan(0);
    });
  });

  describe('summary bar', () => {
    it('shows fallacy count', () => {
      render(<ArgumentMapView content={multiFallacyContent} />);
      expect(screen.getByText(/2 fallacies/)).toBeInTheDocument();
    });

    it('shows rhetoric count for mixed content', () => {
      render(<ArgumentMapView content={mixedMarkupContent} speakers={speakers} />);
      expect(screen.getByText(/1 rhetoric/)).toBeInTheDocument();
    });

    it('shows structural count for mixed content', () => {
      render(<ArgumentMapView content={mixedMarkupContent} speakers={speakers} />);
      expect(screen.getByText(/1 structural/)).toBeInTheDocument();
    });
  });

  describe('tag clicks', () => {
    it('calls onFallacyClick when a fallacy tag is clicked', () => {
      const onFallacyClick = jest.fn();
      render(<ArgumentMapView content={singleFallacyContent} onFallacyClick={onFallacyClick} />);
      // Find the fallacy tag button — it contains "Straw Man" (the label from FALLACIES data)
      const tag = screen.getByText((_, el) => {
        return el?.tagName === 'BUTTON' && !!el?.textContent?.includes('Straw Man');
      });
      fireEvent.click(tag);
      expect(onFallacyClick).toHaveBeenCalledWith('straw-man');
    });
  });
});
