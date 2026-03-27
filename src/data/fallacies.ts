import { Fallacy } from '../models';

export const FALLACIES: Fallacy[] = [
  // Informal Fallacies (sorted A–Z, gradient: deep red → orange)
  {
    id: 'ad-hominem',
    name: 'Ad Hominem',
    description: 'Attacking the person making the argument rather than the argument itself.',
    category: 'informal',
    color: '#7F1D1D',
    examples: ["You can't trust John's opinion on climate change - he's not even a scientist."],
  },
  {
    id: 'appeal-to-authority',
    name: 'Appeal to Authority',
    description:
      "Using an authority figure's opinion as evidence when they lack relevant expertise.",
    category: 'informal',
    color: '#861F1C',
  },
  {
    id: 'appeal-to-ignorance',
    name: 'Appeal to Ignorance',
    description: 'Claiming something is true because it has not been proven false, or vice versa.',
    category: 'informal',
    color: '#8D211B',
    examples: ["Nobody has proven that ghosts don't exist, so they must be real."],
  },
  {
    id: 'appeal-to-nature',
    name: 'Appeal to Nature',
    description:
      'Arguing that something is good because it is natural, or bad because it is unnatural.',
    category: 'informal',
    color: '#94231A',
    examples: ['This remedy is natural, so it must be safe and effective.'],
  },
  {
    id: 'appeal-to-novelty',
    name: 'Appeal to Novelty',
    description: 'Arguing that something is better simply because it is new or modern.',
    category: 'informal',
    color: '#9B2619',
    examples: ['This new approach must be better than the old one because it is more recent.'],
  },
  {
    id: 'appeal-to-tradition',
    name: 'Appeal to Tradition',
    description:
      'Arguing that something is correct or better because it has always been done that way.',
    category: 'informal',
    color: '#A22918',
    examples: ["We've always done it this way, so there's no reason to change."],
  },
  {
    id: 'bandwagon',
    name: 'Bandwagon (Appeal to Popularity)',
    description: 'Arguing something is true or good because many people believe it or do it.',
    category: 'informal',
    color: '#A92C17',
    examples: ['Millions of people believe this, so it must be true.'],
  },
  {
    id: 'burden-of-proof',
    name: 'Burden of Proof (Shifting)',
    description:
      'Placing the burden of proof on the wrong side, typically demanding someone prove a negative.',
    category: 'informal',
    color: '#B02F16',
    examples: ["You can't prove it doesn't work, so it must work."],
  },
  {
    id: 'equivocation',
    name: 'Equivocation',
    description:
      'Using an ambiguous term in more than one sense within an argument, making the conclusion misleading.',
    category: 'informal',
    color: '#B73315',
    examples: [
      '"A feather is light. What is light cannot be dark. Therefore, a feather cannot be dark."',
    ],
  },
  {
    id: 'false-cause',
    name: 'False Cause (Cum Hoc)',
    description:
      'Assuming that because two things occur together, one must cause the other (correlation vs. causation).',
    category: 'informal',
    color: '#BE3714',
    examples: [
      'Ice cream sales and drowning deaths both rise in summer, so ice cream must cause drowning.',
    ],
  },
  {
    id: 'false-dilemma',
    name: 'False Dilemma',
    description: 'Presenting only two options when more exist.',
    category: 'informal',
    color: '#C53B13',
    examples: [
      "You're either with us or against us.",
      'Either we ban all cars or the planet will be destroyed.',
    ],
  },
  {
    id: 'genetic-fallacy',
    name: 'Genetic Fallacy',
    description:
      'Judging something as good or bad based on where it comes from rather than its current merits.',
    category: 'informal',
    color: '#CC3F12',
    examples: ["That idea came from a discredited organization, so it can't be right."],
  },
  {
    id: 'loaded-question',
    name: 'Loaded Question',
    description: 'Asking a question that contains an unjustified assumption built into it.',
    category: 'informal',
    color: '#D34411',
    examples: ['Have you stopped cheating on exams?'],
  },
  {
    id: 'middle-ground',
    name: 'Middle Ground (False Compromise)',
    description: 'Assuming that the truth must be a compromise between two opposing positions.',
    category: 'informal',
    color: '#DA4910',
    examples: [
      'One side says the earth is round, the other says flat, so the truth must be somewhere in between.',
    ],
  },
  {
    id: 'motte-and-bailey',
    name: 'Motte and Bailey',
    description:
      'Defending a controversial position by retreating to a more defensible one, then re-asserting the original claim.',
    category: 'informal',
    color: '#E04E0F',
    examples: [
      '"All cultural practices are equally valid." When challenged: "I just mean we should respect other cultures." Then later reasserts the original claim.',
    ],
  },
  {
    id: 'moving-goalposts',
    name: 'Moving the Goalposts',
    description:
      'Changing the criteria for proof or acceptance after the original criteria have been met.',
    category: 'informal',
    color: '#E5540E',
    examples: [
      '"Show me one study." "OK, but that\'s just one study — show me a meta-analysis." "OK, but that meta-analysis is outdated..."',
    ],
  },
  {
    id: 'no-true-scotsman',
    name: 'No True Scotsman',
    description:
      'Redefining the criteria of a group to exclude counterexamples rather than accepting them.',
    category: 'informal',
    color: '#EA5A0D',
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
    color: '#EE610C',
    examples: ['I wore my lucky shirt and we won the game, so my shirt caused the victory.'],
  },
  {
    id: 'slippery-slope',
    name: 'Slippery Slope',
    description: 'Arguing that one event will lead to a chain of negative events without evidence.',
    category: 'informal',
    color: '#F1680B',
  },
  {
    id: 'special-pleading',
    name: 'Special Pleading',
    description:
      'Applying rules or standards to others while making unjustified exceptions for oneself.',
    category: 'informal',
    color: '#F4700A',
    examples: [
      'Everyone should follow the speed limit, but I was running late so it was fine for me.',
    ],
  },
  {
    id: 'straw-man',
    name: 'Straw Man',
    description: "Misrepresenting someone's argument to make it easier to attack.",
    category: 'informal',
    color: '#F77809',
    examples: [
      'Person A: We should have stricter environmental regulations. Person B: Person A wants to destroy all businesses and jobs.',
    ],
  },
  {
    id: 'sunk-cost',
    name: 'Sunk Cost Fallacy',
    description:
      'Continuing a course of action because of previously invested resources rather than future value.',
    category: 'informal',
    color: '#F98008',
    examples: ["We've already spent $10 million on this project, so we can't stop now."],
  },

  // Red Herring Fallacies (sorted A–Z, gradient: crimson → red)
  {
    id: 'appeal-to-emotion',
    name: 'Appeal to Emotion',
    description: 'Using emotions rather than logic to persuade.',
    category: 'red-herring',
    color: '#991B1B',
  },
  {
    id: 'gish-gallop',
    name: 'Gish Gallop',
    description:
      'Overwhelming an opponent with as many arguments as possible, regardless of accuracy, to make them impossible to refute in real time.',
    category: 'red-herring',
    color: '#AC2222',
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
    color: '#BF2929',
    examples: [
      'Before my opponent speaks, keep in mind that they were once caught lying about their credentials.',
    ],
  },
  {
    id: 'red-herring',
    name: 'Red Herring',
    description: 'Introducing an irrelevant topic to divert attention from the original issue.',
    category: 'red-herring',
    color: '#D23030',
  },
  {
    id: 'tu-quoque',
    name: 'Tu Quoque',
    description: "Deflecting criticism by pointing out the critic's similar behavior.",
    category: 'red-herring',
    color: '#E53838',
  },
  {
    id: 'whataboutism',
    name: 'Whataboutism',
    description:
      'Deflecting criticism by raising a different issue, typically about the opponent, rather than addressing the argument.',
    category: 'red-herring',
    color: '#F84040',
    examples: ['"Our country has human rights issues." "What about your country\'s problems?"'],
  },

  // Formal Fallacies (sorted A–Z, gradient: amber)
  {
    id: 'affirming-consequent',
    name: 'Affirming the Consequent',
    description: 'Assuming that if A implies B, then B implies A.',
    category: 'formal',
    color: '#B45309',
  },
  {
    id: 'denying-antecedent',
    name: 'Denying the Antecedent',
    description: 'Assuming that if A implies B, then not-A implies not-B.',
    category: 'formal',
    color: '#CA7A08',
  },
  {
    id: 'gamblers-fallacy',
    name: "Gambler's Fallacy",
    description:
      'Believing that past independent random events affect the probability of future random events.',
    category: 'formal',
    color: '#E0A107',
    examples: ['The coin landed heads five times in a row, so tails is due next.'],
  },

  // Faulty Generalizations (sorted A–Z, gradient: amber-yellow)
  {
    id: 'cherry-picking',
    name: 'Cherry Picking',
    description:
      'Selecting only evidence that supports your conclusion while ignoring contradicting evidence.',
    category: 'faulty-generalization',
    color: '#CA8A04',
  },
  {
    id: 'hasty-generalization',
    name: 'Hasty Generalization',
    description: 'Drawing a broad conclusion from a small or unrepresentative sample.',
    category: 'faulty-generalization',
    color: '#DAA706',
  },
  {
    id: 'texas-sharpshooter',
    name: 'Texas Sharpshooter',
    description:
      'Cherry-picking data clusters to suit an argument after the fact, ignoring data that does not fit.',
    category: 'faulty-generalization',
    color: '#EAC408',
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
    color: '#EAB308',
  },

  // Quantification Fallacies (sorted A–Z, gradient: gold)
  {
    id: 'composition',
    name: 'Composition',
    description: 'Assuming what is true of the parts is true of the whole.',
    category: 'quantification',
    color: '#D4990C',
  },
  {
    id: 'division',
    name: 'Division',
    description: 'Assuming what is true of the whole is true of the parts.',
    category: 'quantification',
    color: '#E8B310',
  },

  // Syllogistic Fallacies
  {
    id: 'undistributed-middle',
    name: 'Undistributed Middle',
    description: 'The middle term in a syllogism is not distributed in at least one premise.',
    category: 'syllogistic',
    color: '#DBA514',
  },

  // Conditional Fallacies (sorted A–Z, gradient: warm yellow)
  {
    id: 'begging-question',
    name: 'Begging the Question',
    description: 'The conclusion is assumed in one of the premises.',
    category: 'conditional',
    color: '#D4A316',
  },
  {
    id: 'circular-reasoning',
    name: 'Circular Reasoning',
    description: "The argument's conclusion is used as one of its premises.",
    category: 'conditional',
    color: '#E8BD20',
  },
];
