import { Descendant } from 'slate';
import { Speaker, DEFAULT_SPEAKER_COLORS } from '../models';

export const EXAMPLE_DOCUMENT_TITLE = 'Example: Analyzing a Political Debate';

// Default speakers for the example document
export const EXAMPLE_SPEAKERS: Speaker[] = [
  { id: 'speaker_a', name: 'Speaker A', color: DEFAULT_SPEAKER_COLORS[0], shortName: 'A' },
  { id: 'speaker_b', name: 'Speaker B', color: DEFAULT_SPEAKER_COLORS[1], shortName: 'B' },
];

// Default speakers for new documents
export const DEFAULT_SPEAKERS: Speaker[] = [
  { id: 'speaker_a', name: 'Speaker A', color: DEFAULT_SPEAKER_COLORS[0], shortName: 'A' },
  { id: 'speaker_b', name: 'Speaker B', color: DEFAULT_SPEAKER_COLORS[1], shortName: 'B' },
];

export const EXAMPLE_DOCUMENT_CONTENT: Descendant[] = [
  {
    type: 'heading-one',
    children: [{ text: 'Welcome to Debate Dissector!' }],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'This example demonstrates how to identify fallacies, rhetoric, and claims in arguments. ' },
      { text: 'Click on any highlighted text to see details in the sidebar.', italic: true },
    ],
  },
  {
    type: 'heading-two',
    children: [{ text: 'Sample Debate' }],
  },
  {
    type: 'paragraph',
    speakerId: 'speaker_a',
    children: [
      { text: '"' },
      {
        text: "Studies show that renewable energy creates 3x more jobs than fossil fuels.",
        structuralMarks: [{
          id: 'mark_claim_1',
          markupId: 'statistic',
          color: '#06b6d4',
          appliedAt: Date.now(),
        }],
      },
      { text: ' We need to invest more in clean energy to combat climate change."' },
    ],
  },
  {
    type: 'paragraph',
    speakerId: 'speaker_b',
    children: [
      { text: '"' },
      {
        text: "So you want to destroy the entire oil industry and put millions of people out of work?",
        fallacyId: 'straw-man',
        fallacyColor: '#EF4444',
        fallacyMarks: [{
          id: 'mark_example_1',
          fallacyId: 'straw-man',
          color: '#EF4444',
          appliedAt: Date.now(),
        }],
        // Overlapping: This is also an emotional appeal (rhetoric)
        rhetoricMarks: [{
          id: 'mark_rhetoric_1',
          rhetoricId: 'appeal-to-fear',
          color: '#C084FC',
          appliedAt: Date.now() + 1,
        }],
      },
      { text: ' That\'s ridiculous. ' },
      {
        text: "Besides, you drive a car yourself, so you're being hypocritical.",
        fallacyId: 'tu-quoque',
        fallacyColor: '#EA580C',
        fallacyMarks: [{
          id: 'mark_example_2',
          fallacyId: 'tu-quoque',
          color: '#EA580C',
          appliedAt: Date.now(),
        }],
      },
      { text: '"' },
    ],
  },
  {
    type: 'paragraph',
    speakerId: 'speaker_a',
    children: [
      { text: '"That\'s not what I said. ' },
      {
        text: "According to the International Energy Agency, solar power is now the cheapest electricity in history.",
        structuralMarks: [{
          id: 'mark_evidence_1',
          markupId: 'evidence',
          color: '#10b981',
          appliedAt: Date.now(),
          metadata: {
            sourceUrl: 'https://www.iea.org/reports/world-energy-outlook-2020',
            sourceAuthor: 'International Energy Agency',
            sourceDate: '2020',
            sourcePublication: 'World Energy Outlook 2020',
            verificationStatus: 'verified' as const,
          },
        }],
      },
      { text: '"' },
    ],
  },
  {
    type: 'paragraph',
    speakerId: 'speaker_b',
    children: [
      { text: '"' },
      {
        text: "Either we keep using fossil fuels or the economy collapses.",
        fallacyId: 'false-dilemma',
        fallacyColor: '#FB923C',
        fallacyMarks: [{
          id: 'mark_example_3',
          fallacyId: 'false-dilemma',
          color: '#FB923C',
          appliedAt: Date.now(),
        }],
      },
      { text: ' ' },
      {
        text: "Think of your children's future – do you want them living in poverty?",
        rhetoricMarks: [{
          id: 'mark_rhetoric_2',
          rhetoricId: 'emotional-appeal',
          color: '#7C3AED',
          appliedAt: Date.now(),
        }],
      },
      { text: '"' },
    ],
  },
  {
    type: 'paragraph',
    speakerId: 'speaker_a',
    children: [
      { text: '"' },
      {
        text: "The transition will take decades and create new opportunities,",
        structuralMarks: [{
          id: 'mark_claim_2',
          markupId: 'claim',
          color: '#8b5cf6',
          appliedAt: Date.now(),
        }],
      },
      { text: " but we can't just ignore the risks of fossil fuel." },
      { text: '"' },
    ],
  },
  {
    type: 'heading-two',
    children: [{ text: 'What to Look For' }],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'Fallacies', bold: true },
      { text: ' - Logical errors like straw man, false dilemma, tu quoque' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'Rhetoric', bold: true },
      { text: ' - Persuasion techniques like emotional appeals' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'Claims & Evidence', bold: true },
      { text: ' - Mark claims, statistics, and supporting evidence' },
    ],
  },
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'Notice the "+1" badge on overlapping annotations – click it to see all annotations on that text!', italic: true },
    ],
  },
];
