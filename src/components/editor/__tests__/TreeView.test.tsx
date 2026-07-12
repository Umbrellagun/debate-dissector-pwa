import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Descendant } from 'slate';
import { TreeView } from '../TreeView';
import { ArgumentLink } from '../../../models/document';

const makeFallacyMark = (id: string, fallacyId: string) => ({
  id,
  fallacyId,
  color: '#EF4444',
  appliedAt: Date.now(),
});

const makeBlockContent = (id: string, text: string): Descendant => ({
  type: 'paragraph',
  children: [
    {
      text,
      fallacyMarks: [makeFallacyMark(id, 'straw-man')],
    },
  ],
});

const contentForScenario: Descendant[] = [
  makeBlockContent('mark-a', 'Parent A'),
  makeBlockContent('mark-b', 'Child B'),
  makeBlockContent('mark-c', 'Child C'),
];

describe('TreeView', () => {
  describe('remove node scenario', () => {
    it('removes a child-with-parent node and promotes its children to the parent', () => {
      const linkToParent: ArgumentLink = {
        id: 'link-b-a',
        sourceMarkId: 'mark-b',
        targetMarkId: 'mark-a',
        linkType: 'supports',
        createdAt: 1000,
      };
      const linkToChild: ArgumentLink = {
        id: 'link-c-b',
        sourceMarkId: 'mark-c',
        targetMarkId: 'mark-b',
        linkType: 'supports',
        createdAt: 2000,
      };

      const onReplaceLinks = jest.fn();

      const { container } = render(
        <TreeView
          content={contentForScenario}
          argumentLinks={[linkToParent, linkToChild]}
          onReplaceLinks={onReplaceLinks}
        />
      );

      // Open the context menu for mark-b (which is the child of mark-a and parent of mark-c)
      const nodeB = container.querySelector('[data-node-id="mark-b"]');
      const contextBtn = nodeB?.querySelector('[data-role="context-menu-btn"]');
      expect(contextBtn).toBeTruthy();
      fireEvent.click(contextBtn!);

      // Open the confirmation dialog
      fireEvent.click(screen.getByText('Remove from Tree'));

      // Confirm the removal
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

      expect(onReplaceLinks).toHaveBeenCalledTimes(1);
      const [deleteIds, newLinks] = onReplaceLinks.mock.calls[0];

      expect(deleteIds).toHaveLength(2);
      expect(deleteIds).toContain('link-b-a');
      expect(deleteIds).toContain('link-c-b');

      expect(newLinks).toHaveLength(1);
      expect(newLinks[0].sourceMarkId).toBe('mark-c');
      expect(newLinks[0].targetMarkId).toBe('mark-a');
      expect(newLinks[0].linkType).toBe('supports');
    });
  });
});
