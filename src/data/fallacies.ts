import { Fallacy } from '../models';

export const FALLACIES: Fallacy[] = [
  // Informal Fallacies
  {
    id: 'straw-man',
    name: 'Straw Man',
    description: "Misrepresenting someone's argument to make it easier to attack.",
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
    examples: ["You can't trust John's opinion on climate change - he's not even a scientist."],
  },
  {
    id: 'false-dilemma',
    name: 'False Dilemma',
    description: 'Presenting only two options when more exist.',
    category: 'informal',
    color: '#FB923C',
    examples: [
      "You're either with us or against us.",
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
    description:
      "Using an authority figure's opinion as evidence when they lack relevant expertise.",
    category: 'informal',
    color: '#FCD34D',
  },
  {
    id: 'motte-and-bailey',
    name: 'Motte and Bailey',
    description:
      'Defending a controversial position by retreating to a more defensible one, then re-asserting the original claim.',
    category: 'informal',
    color: '#E11D48',
    examples: [
      '"All cultural practices are equally valid." When challenged: "I just mean we should respect other cultures." Then later reasserts the original claim.',
    ],
  },
  {
    id: 'no-true-scotsman',
    name: 'No True Scotsman',
    description:
      'Redefining the criteria of a group to exclude counterexamples rather than accepting them.',
    category: 'informal',
    color: '#F43F5E',
    examples: [
      '"No Scotsman puts sugar on his porridge." "But my uncle is Scottish and he does." "Well, no TRUE Scotsman puts sugar on his porridge."',
    ],
  },
  {
    id: 'post-hoc',
    name: 'Post Hoc Ergo Propter Hoc',
    description:
      'Assuming that because one event followed another, the first event caused the second.',
    category: 'informal',
    color: '#D97706',
    examples: ['I wore my lucky shirt and we won the game, so my shirt caused the victory.'],
  },
  {
    id: 'appeal-to-ignorance',
    name: 'Appeal to Ignorance',
    description: 'Claiming something is true because it has not been proven false, or vice versa.',
    category: 'informal',
    color: '#E07B39',
    examples: ["Nobody has proven that ghosts don't exist, so they must be real."],
  },
  {
    id: 'bandwagon',
    name: 'Bandwagon (Appeal to Popularity)',
    description: 'Arguing something is true or good because many people believe it or do it.',
    category: 'informal',
    color: '#CA8A04',
    examples: ['Millions of people believe this, so it must be true.'],
  },
  {
    id: 'moving-goalposts',
    name: 'Moving the Goalposts',
    description:
      'Changing the criteria for proof or acceptance after the original criteria have been met.',
    category: 'informal',
    color: '#B45309',
    examples: [
      '"Show me one study." "OK, but that\'s just one study — show me a meta-analysis." "OK, but that meta-analysis is outdated..."',
    ],
  },
  {
    id: 'equivocation',
    name: 'Equivocation',
    description:
      'Using an ambiguous term in more than one sense within an argument, making the conclusion misleading.',
    category: 'informal',
    color: '#DC6B2F',
    examples: [
      '"A feather is light. What is light cannot be dark. Therefore, a feather cannot be dark."',
    ],
  },
  {
    id: 'loaded-question',
    name: 'Loaded Question',
    description: 'Asking a question that contains an unjustified assumption built into it.',
    category: 'informal',
    color: '#E8590C',
    examples: ['Have you stopped cheating on exams?'],
  },
  {
    id: 'appeal-to-nature',
    name: 'Appeal to Nature',
    description:
      'Arguing that something is good because it is natural, or bad because it is unnatural.',
    category: 'informal',
    color: '#C2410C',
    examples: ['This remedy is natural, so it must be safe and effective.'],
  },
  {
    id: 'genetic-fallacy',
    name: 'Genetic Fallacy',
    description:
      'Judging something as good or bad based on where it comes from rather than its current merits.',
    category: 'informal',
    color: '#DB2777',
    examples: ["That idea came from a discredited organization, so it can't be right."],
  },
  {
    id: 'sunk-cost',
    name: 'Sunk Cost Fallacy',
    description:
      'Continuing a course of action because of previously invested resources rather than future value.',
    category: 'informal',
    color: '#EA580C',
    examples: ["We've already spent $10 million on this project, so we can't stop now."],
  },
  {
    id: 'appeal-to-tradition',
    name: 'Appeal to Tradition',
    description:
      'Arguing that something is correct or better because it has always been done that way.',
    category: 'informal',
    color: '#D97706',
    examples: ["We've always done it this way, so there's no reason to change."],
  },
  {
    id: 'appeal-to-novelty',
    name: 'Appeal to Novelty',
    description: 'Arguing that something is better simply because it is new or modern.',
    category: 'informal',
    color: '#F59E0B',
    examples: ['This new approach must be better than the old one because it is more recent.'],
  },
  {
    id: 'false-cause',
    name: 'False Cause (Cum Hoc)',
    description:
      'Assuming that because two things occur together, one must cause the other (correlation vs. causation).',
    category: 'informal',
    color: '#B45309',
    examples: [
      'Ice cream sales and drowning deaths both rise in summer, so ice cream must cause drowning.',
    ],
  },
  {
    id: 'burden-of-proof',
    name: 'Burden of Proof (Shifting)',
    description:
      'Placing the burden of proof on the wrong side, typically demanding someone prove a negative.',
    category: 'informal',
    color: '#C2410C',
    examples: ["You can't prove it doesn't work, so it must work."],
  },
  {
    id: 'middle-ground',
    name: 'Middle Ground (False Compromise)',
    description: 'Assuming that the truth must be a compromise between two opposing positions.',
    category: 'informal',
    color: '#DC6B2F',
    examples: [
      'One side says the earth is round, the other says flat, so the truth must be somewhere in between.',
    ],
  },
  {
    id: 'special-pleading',
    name: 'Special Pleading',
    description:
      'Applying rules or standards to others while making unjustified exceptions for oneself.',
    category: 'informal',
    color: '#E8590C',
    examples: [
      'Everyone should follow the speed limit, but I was running late so it was fine for me.',
    ],
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
    description: "Deflecting criticism by pointing out the critic's similar behavior.",
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
  {
    id: 'whataboutism',
    name: 'Whataboutism',
    description:
      'Deflecting criticism by raising a different issue, typically about the opponent, rather than addressing the argument.',
    category: 'red-herring',
    color: '#BE123C',
    examples: ['"Our country has human rights issues." "What about your country\'s problems?"'],
  },
  {
    id: 'gish-gallop',
    name: 'Gish Gallop',
    description:
      'Overwhelming an opponent with as many arguments as possible, regardless of accuracy, to make them impossible to refute in real time.',
    category: 'red-herring',
    color: '#D4540E',
    examples: [
      'Rapidly listing 20 different claims in a two-minute speech, making it impossible to address each one.',
    ],
  },
  {
    id: 'poisoning-the-well',
    name: 'Poisoning the Well',
    description:
      'Preemptively presenting negative information about an opponent to discredit them before they speak.',
    category: 'red-herring',
    color: '#9F1239',
    examples: [
      'Before my opponent speaks, keep in mind that they were once caught lying about their credentials.',
    ],
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
  {
    id: 'gamblers-fallacy',
    name: "Gambler's Fallacy",
    description:
      'Believing that past independent random events affect the probability of future random events.',
    category: 'formal',
    color: '#CA8A04',
    examples: ['The coin landed heads five times in a row, so tails is due next.'],
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
    description:
      'Selecting only evidence that supports your conclusion while ignoring contradicting evidence.',
    category: 'faulty-generalization',
    color: '#FDE047',
  },
  {
    id: 'texas-sharpshooter',
    name: 'Texas Sharpshooter',
    description:
      'Cherry-picking data clusters to suit an argument after the fact, ignoring data that does not fit.',
    category: 'faulty-generalization',
    color: '#FBBF24',
    examples: [
      'Pointing to a cluster of cancer cases near a factory while ignoring clusters elsewhere with no factory.',
    ],
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
    description: "The argument's conclusion is used as one of its premises.",
    category: 'conditional',
    color: '#FECACA',
  },
];
