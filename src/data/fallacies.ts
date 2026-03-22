import { Fallacy } from '../models';

export const FALLACIES: Fallacy[] = [
  // Informal Fallacies
  {
    id: 'straw-man',
    name: 'Straw Man',
    description: 'Misrepresenting someone\'s argument to make it easier to attack.',
    category: 'informal',
    color: '#EF4444',
    examples: [
      'Person A: We should have stricter environmental regulations. Person B: Person A wants to destroy all businesses and jobs.',
    ],
  },
  {
    id: 'ad-hominem',
    name: 'Ad Hominem',
    description: 'Attacking the person making the argument rather than the argument itself.',
    category: 'informal',
    color: '#F87171',
    examples: [
      'You can\'t trust John\'s opinion on climate change - he\'s not even a scientist.',
    ],
  },
  {
    id: 'false-dilemma',
    name: 'False Dilemma',
    description: 'Presenting only two options when more exist.',
    category: 'informal',
    color: '#FB923C',
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
    color: '#FBBF24',
  },
  {
    id: 'appeal-to-authority',
    name: 'Appeal to Authority',
    description: 'Using an authority figure\'s opinion as evidence when they lack relevant expertise.',
    category: 'informal',
    color: '#FCD34D',
  },

  // Red Herring Fallacies
  {
    id: 'red-herring',
    name: 'Red Herring',
    description: 'Introducing an irrelevant topic to divert attention from the original issue.',
    category: 'red-herring',
    color: '#DC2626',
  },
  {
    id: 'tu-quoque',
    name: 'Tu Quoque',
    description: 'Deflecting criticism by pointing out the critic\'s similar behavior.',
    category: 'red-herring',
    color: '#EA580C',
  },
  {
    id: 'appeal-to-emotion',
    name: 'Appeal to Emotion',
    description: 'Using emotions rather than logic to persuade.',
    category: 'red-herring',
    color: '#F97316',
  },

  // Formal Fallacies
  {
    id: 'affirming-consequent',
    name: 'Affirming the Consequent',
    description: 'Assuming that if A implies B, then B implies A.',
    category: 'formal',
    color: '#F59E0B',
  },
  {
    id: 'denying-antecedent',
    name: 'Denying the Antecedent',
    description: 'Assuming that if A implies B, then not-A implies not-B.',
    category: 'formal',
    color: '#EAB308',
  },

  // Faulty Generalizations
  {
    id: 'hasty-generalization',
    name: 'Hasty Generalization',
    description: 'Drawing a broad conclusion from a small or unrepresentative sample.',
    category: 'faulty-generalization',
    color: '#FACC15',
  },
  {
    id: 'cherry-picking',
    name: 'Cherry Picking',
    description: 'Selecting only evidence that supports your conclusion while ignoring contradicting evidence.',
    category: 'faulty-generalization',
    color: '#FDE047',
  },

  // Propositional Fallacies
  {
    id: 'false-equivalence',
    name: 'False Equivalence',
    description: 'Treating two different things as if they are the same.',
    category: 'propositional',
    color: '#FEF08A',
  },

  // Quantification Fallacies
  {
    id: 'composition',
    name: 'Composition',
    description: 'Assuming what is true of the parts is true of the whole.',
    category: 'quantification',
    color: '#FB7185',
  },
  {
    id: 'division',
    name: 'Division',
    description: 'Assuming what is true of the whole is true of the parts.',
    category: 'quantification',
    color: '#FDA4AF',
  },

  // Syllogistic Fallacies
  {
    id: 'undistributed-middle',
    name: 'Undistributed Middle',
    description: 'The middle term in a syllogism is not distributed in at least one premise.',
    category: 'syllogistic',
    color: '#FDBA74',
  },

  // Conditional Fallacies
  {
    id: 'begging-question',
    name: 'Begging the Question',
    description: 'The conclusion is assumed in one of the premises.',
    category: 'conditional',
    color: '#FED7AA',
  },
  {
    id: 'circular-reasoning',
    name: 'Circular Reasoning',
    description: 'The argument\'s conclusion is used as one of its premises.',
    category: 'conditional',
    color: '#FECACA',
  },
];
