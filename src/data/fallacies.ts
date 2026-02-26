import { Fallacy } from '../models';

export const FALLACIES: Fallacy[] = [
  // Informal Fallacies
  {
    id: 'straw-man',
    name: 'Straw Man',
    description: 'Misrepresenting someone\'s argument to make it easier to attack.',
    category: 'informal',
    color: '#FF6B6B',
    examples: [
      'Person A: We should have stricter environmental regulations. Person B: Person A wants to destroy all businesses and jobs.',
    ],
  },
  {
    id: 'ad-hominem',
    name: 'Ad Hominem',
    description: 'Attacking the person making the argument rather than the argument itself.',
    category: 'informal',
    color: '#FF8E72',
    examples: [
      'You can\'t trust John\'s opinion on climate change - he\'s not even a scientist.',
    ],
  },
  {
    id: 'false-dilemma',
    name: 'False Dilemma',
    description: 'Presenting only two options when more exist.',
    category: 'informal',
    color: '#FFA94D',
    examples: [
      'You\'re either with us or against us.',
      'Either we ban all cars or the planet will be destroyed.',
    ],
  },
  {
    id: 'slippery-slope',
    name: 'Slippery Slope',
    description: 'Arguing that one event will lead to a chain of negative events without evidence.',
    category: 'informal',
    color: '#FFD43B',
  },
  {
    id: 'appeal-to-authority',
    name: 'Appeal to Authority',
    description: 'Using an authority figure\'s opinion as evidence when they lack relevant expertise.',
    category: 'informal',
    color: '#A9E34B',
  },

  // Red Herring Fallacies
  {
    id: 'red-herring',
    name: 'Red Herring',
    description: 'Introducing an irrelevant topic to divert attention from the original issue.',
    category: 'red-herring',
    color: '#C92A2A',
  },
  {
    id: 'tu-quoque',
    name: 'Tu Quoque',
    description: 'Deflecting criticism by pointing out the critic\'s similar behavior.',
    category: 'red-herring',
    color: '#D9480F',
  },
  {
    id: 'appeal-to-emotion',
    name: 'Appeal to Emotion',
    description: 'Using emotions rather than logic to persuade.',
    category: 'red-herring',
    color: '#A61E4D',
  },

  // Formal Fallacies
  {
    id: 'affirming-consequent',
    name: 'Affirming the Consequent',
    description: 'Assuming that if A implies B, then B implies A.',
    category: 'formal',
    color: '#4DABF7',
  },
  {
    id: 'denying-antecedent',
    name: 'Denying the Antecedent',
    description: 'Assuming that if A implies B, then not-A implies not-B.',
    category: 'formal',
    color: '#748FFC',
  },

  // Faulty Generalizations
  {
    id: 'hasty-generalization',
    name: 'Hasty Generalization',
    description: 'Drawing a broad conclusion from a small or unrepresentative sample.',
    category: 'faulty-generalization',
    color: '#9775FA',
  },
  {
    id: 'cherry-picking',
    name: 'Cherry Picking',
    description: 'Selecting only evidence that supports your conclusion while ignoring contradicting evidence.',
    category: 'faulty-generalization',
    color: '#DA77F2',
  },

  // Propositional Fallacies
  {
    id: 'false-equivalence',
    name: 'False Equivalence',
    description: 'Treating two different things as if they are the same.',
    category: 'propositional',
    color: '#F783AC',
  },

  // Quantification Fallacies
  {
    id: 'composition',
    name: 'Composition',
    description: 'Assuming what is true of the parts is true of the whole.',
    category: 'quantification',
    color: '#F76707',
  },
  {
    id: 'division',
    name: 'Division',
    description: 'Assuming what is true of the whole is true of the parts.',
    category: 'quantification',
    color: '#E8590C',
  },

  // Syllogistic Fallacies
  {
    id: 'undistributed-middle',
    name: 'Undistributed Middle',
    description: 'The middle term in a syllogism is not distributed in at least one premise.',
    category: 'syllogistic',
    color: '#69DB7C',
  },

  // Conditional Fallacies
  {
    id: 'begging-question',
    name: 'Begging the Question',
    description: 'The conclusion is assumed in one of the premises.',
    category: 'conditional',
    color: '#38D9A9',
  },
  {
    id: 'circular-reasoning',
    name: 'Circular Reasoning',
    description: 'The argument\'s conclusion is used as one of its premises.',
    category: 'conditional',
    color: '#3BC9DB',
  },
];
