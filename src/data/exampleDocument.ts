import { Descendant } from 'slate';

export const EXAMPLE_DOCUMENT_TITLE = 'Example: Analyzing a Political Debate';

export const EXAMPLE_DOCUMENT_CONTENT: Descendant[] = [
  {
    type: 'heading-one',
    children: [{ text: 'Welcome to Debate Dissector!' }],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'This example document demonstrates how to identify and mark logical fallacies and rhetorical techniques in arguments. ' },
      { text: 'Select any text and use the sidebar to apply annotations.', italic: true },
    ],
  },
  {
    type: 'heading-two',
    children: [{ text: 'Sample Argument with Fallacies' }],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'Speaker A: "We need to invest more in renewable energy to combat climate change."' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'Speaker B: "' },
      {
        text: "So you want to destroy the entire oil industry and put millions of people out of work?",
        fallacyId: 'straw-man',
        fallacyColor: '#FF6B6B',
        fallacyMarks: [{
          id: 'mark_example_1',
          fallacyId: 'straw-man',
          color: '#FF6B6B',
          appliedAt: Date.now(),
        }],
      },
      { text: ' That\'s ridiculous. ' },
      {
        text: "Besides, you drive a car yourself, so you're being hypocritical.",
        fallacyId: 'tu-quoque',
        fallacyColor: '#38D9A9',
        fallacyMarks: [{
          id: 'mark_example_2',
          fallacyId: 'tu-quoque',
          color: '#38D9A9',
          appliedAt: Date.now(),
        }],
      },
      { text: '"' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'Speaker A: "That\'s not what I said. I\'m talking about gradual investment in—"' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'Speaker B: "' },
      {
        text: "Either we keep using fossil fuels or the economy collapses.",
        fallacyId: 'false-dilemma',
        fallacyColor: '#FFA94D',
        fallacyMarks: [{
          id: 'mark_example_3',
          fallacyId: 'false-dilemma',
          color: '#FFA94D',
          appliedAt: Date.now(),
        }],
      },
      { text: ' ' },
      {
        text: "My friend who works at a gas station says green energy doesn't work.",
        fallacyId: 'appeal-to-authority',
        fallacyColor: '#A9E34B',
        fallacyMarks: [{
          id: 'mark_example_4',
          fallacyId: 'appeal-to-authority',
          color: '#A9E34B',
          appliedAt: Date.now(),
        }],
      },
      { text: '"' },
    ],
  },
  {
    type: 'heading-two',
    children: [{ text: 'Fallacies Identified' }],
  },
  {
    type: 'paragraph',
    children: [
      { text: '1. ', bold: true },
      { text: 'Straw Man', bold: true },
      { text: ' - Misrepresenting the opponent\'s position as wanting to "destroy the entire oil industry"' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: '2. ', bold: true },
      { text: 'Tu Quoque', bold: true },
      { text: ' - Attacking the speaker for driving a car instead of addressing the argument' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: '3. ', bold: true },
      { text: 'False Dilemma', bold: true },
      { text: ' - Presenting only two extreme options when many alternatives exist' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: '4. ', bold: true },
      { text: 'Appeal to Authority', bold: true },
      { text: ' - Citing a gas station worker as an authority on energy policy' },
    ],
  },
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'Try clicking on the highlighted text to see details about each fallacy in the sidebar!', italic: true },
    ],
  },
];
