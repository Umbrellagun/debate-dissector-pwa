import { Rhetoric } from '../models';

export const RHETORIC_TECHNIQUES: Rhetoric[] = [
  // Ethos - Appeals to Credibility
  {
    id: 'appeal-to-authority',
    name: 'Appeal to Authority',
    description: 'Citing experts or authorities to support a claim.',
    category: 'ethos',
    color: '#4C6EF5',
    examples: [
      'According to Dr. Smith, a leading expert in climate science...',
    ],
  },
  {
    id: 'establishing-credibility',
    name: 'Establishing Credibility',
    description: 'Demonstrating expertise, experience, or trustworthiness.',
    category: 'ethos',
    color: '#5C7CFA',
    examples: [
      'As someone who has worked in this field for 20 years...',
    ],
  },
  {
    id: 'shared-values',
    name: 'Shared Values',
    description: 'Connecting with the audience through common beliefs or principles.',
    category: 'ethos',
    color: '#748FFC',
    examples: [
      'Like you, I believe in the importance of family and community.',
    ],
  },
  {
    id: 'testimonial',
    name: 'Testimonial',
    description: 'Using endorsements from respected individuals or groups.',
    category: 'ethos',
    color: '#91A7FF',
    examples: [
      'This product is recommended by 9 out of 10 dentists.',
    ],
  },

  // Pathos - Appeals to Emotion
  {
    id: 'emotional-appeal',
    name: 'Emotional Appeal',
    description: 'Evoking feelings such as fear, hope, anger, or sympathy.',
    category: 'pathos',
    color: '#F03E3E',
    examples: [
      'Think of the children who will suffer if we don\'t act now.',
    ],
  },
  {
    id: 'storytelling',
    name: 'Storytelling',
    description: 'Using narratives to create emotional connection and engagement.',
    category: 'pathos',
    color: '#FA5252',
    examples: [
      'Let me tell you about Maria, a single mother who...',
    ],
  },
  {
    id: 'vivid-imagery',
    name: 'Vivid Imagery',
    description: 'Using descriptive language to paint pictures and evoke emotions.',
    category: 'pathos',
    color: '#FF6B6B',
    examples: [
      'Imagine waking up to the sound of birds singing, the smell of fresh coffee...',
    ],
  },
  {
    id: 'appeal-to-fear',
    name: 'Appeal to Fear',
    description: 'Warning of negative consequences to motivate action.',
    category: 'pathos',
    color: '#FF8787',
    examples: [
      'If we don\'t address this issue now, the consequences could be catastrophic.',
    ],
  },
  {
    id: 'appeal-to-hope',
    name: 'Appeal to Hope',
    description: 'Inspiring optimism about positive outcomes.',
    category: 'pathos',
    color: '#FFA8A8',
    examples: [
      'Together, we can build a brighter future for the next generation.',
    ],
  },

  // Logos - Appeals to Logic
  {
    id: 'statistical-evidence',
    name: 'Statistical Evidence',
    description: 'Using data and statistics to support claims.',
    category: 'logos',
    color: '#12B886',
    examples: [
      'Studies show that 78% of participants experienced improvement.',
    ],
  },
  {
    id: 'logical-reasoning',
    name: 'Logical Reasoning',
    description: 'Using deductive or inductive reasoning to reach conclusions.',
    category: 'logos',
    color: '#20C997',
    examples: [
      'If A leads to B, and B leads to C, then A must lead to C.',
    ],
  },
  {
    id: 'factual-evidence',
    name: 'Factual Evidence',
    description: 'Presenting verifiable facts to support arguments.',
    category: 'logos',
    color: '#38D9A9',
    examples: [
      'The Earth orbits the Sun at approximately 67,000 miles per hour.',
    ],
  },
  {
    id: 'analogy',
    name: 'Analogy',
    description: 'Comparing similar situations to illustrate a point.',
    category: 'logos',
    color: '#63E6BE',
    examples: [
      'Just as a ship needs a captain, an organization needs strong leadership.',
    ],
  },
  {
    id: 'cause-and-effect',
    name: 'Cause and Effect',
    description: 'Demonstrating how one event leads to another.',
    category: 'logos',
    color: '#96F2D7',
    examples: [
      'Reducing carbon emissions will lead to cleaner air and improved public health.',
    ],
  },

  // Kairos - Appeals to Timing
  {
    id: 'urgency',
    name: 'Urgency',
    description: 'Emphasizing the need for immediate action.',
    category: 'kairos',
    color: '#F59F00',
    examples: [
      'Act now - this offer expires at midnight!',
    ],
  },
  {
    id: 'timeliness',
    name: 'Timeliness',
    description: 'Connecting arguments to current events or trends.',
    category: 'kairos',
    color: '#FAB005',
    examples: [
      'In light of recent developments, it\'s more important than ever to...',
    ],
  },
  {
    id: 'historical-moment',
    name: 'Historical Moment',
    description: 'Framing the situation as a pivotal point in history.',
    category: 'kairos',
    color: '#FCC419',
    examples: [
      'We stand at a crossroads that will define our generation.',
    ],
  },
  {
    id: 'seasonal-appeal',
    name: 'Seasonal/Contextual Appeal',
    description: 'Leveraging specific times, seasons, or contexts.',
    category: 'kairos',
    color: '#FFD43B',
    examples: [
      'As we enter the holiday season, let\'s remember those less fortunate.',
    ],
  },
];
