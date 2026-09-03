import { renderDocumentHtmlBody, exportDocumentAsText } from '../documentExport';
import { DebateDocument } from '../../../models';

jest.mock('../download', () => ({
  downloadFile: jest.fn(),
}));

import { downloadFile } from '../download';

const createDoc = (overrides?: Partial<DebateDocument>): DebateDocument => ({
  id: 'test-doc',
  title: 'Debate Test',
  content: [
    {
      type: 'paragraph',
      speakerId: 'alice',
      children: [
        { text: 'We should ban this practice, ' },
        {
          text: 'it is clearly a straw man',
          fallacyMarks: [{ id: 'm1', fallacyId: 'straw-man', color: '#EF4444', appliedAt: 1 }],
        },
      ],
    },
  ],
  speakers: [{ id: 'alice', name: 'Alice', color: '#3B82F6' }],
  annotations: {},
  createdAt: 0,
  updatedAt: 0,
  ...overrides,
});

describe('documentExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('renderDocumentHtmlBody', () => {
    it('escapes text and includes speaker badge', () => {
      const html = renderDocumentHtmlBody(createDoc({ title: 'Debate <Test>' }));
      expect(html).toContain('Debate &lt;Test&gt;');
      expect(html).toContain('Alice');
      expect(html).toContain('background-color:#3B82F618');
    });

    it('preserves fallacy annotation color in inline style', () => {
      const html = renderDocumentHtmlBody(createDoc());
      expect(html).toContain('it is clearly a straw man');
      expect(html).toContain('background-color:#F77809');
    });
  });

  describe('exportDocumentAsText', () => {
    it('downloads a plain text file with speaker labels and title', () => {
      exportDocumentAsText(createDoc());
      expect(downloadFile).toHaveBeenCalledTimes(1);
      const [content, filename] = (downloadFile as jest.Mock).mock.calls[0];
      expect(content).toContain('Debate Test');
      expect(content).toContain('Alice: We should ban this practice, it is clearly a straw man');
      expect(filename).toBe('Debate Test.txt');
      expect((downloadFile as jest.Mock).mock.calls[0][2]).toBe('text/plain');
    });
  });

  describe('overlapping annotations', () => {
    const createOverlapDoc = (): DebateDocument =>
      createDoc({
        content: [
          {
            type: 'paragraph',
            speakerId: 'alice',
            children: [
              { text: 'This is ' },
              {
                text: 'a straw man and an appeal',
                fallacyMarks: [
                  { id: 'm1', fallacyId: 'straw-man', color: '#F77809', appliedAt: 1 },
                ],
                rhetoricMarks: [
                  { id: 'm2', rhetoricId: 'appeal-to-authority', color: '#166534', appliedAt: 2 },
                ],
              },
            ],
          },
        ],
      });

    it('renders a chip for each overlapping mark in HTML', () => {
      const html = renderDocumentHtmlBody(createOverlapDoc());
      // Both annotation labels should be present as chips, not just the last one
      expect(html).toContain('Straw Man');
      expect(html).toContain('Appeal to Authority');
      // Chip colors for both marks should appear
      expect(html).toContain('background-color:#F77809');
      expect(html).toContain('background-color:#166534');
    });

    it('lists every overlapping mark as bracket tags in plain text', () => {
      exportDocumentAsText(createOverlapDoc());
      const [content] = (downloadFile as jest.Mock).mock.calls[0];
      expect(content).toContain(
        'a straw man and an appeal [Fallacy: Straw Man; Rhetoric: Appeal to Authority]'
      );
    });
  });
});
