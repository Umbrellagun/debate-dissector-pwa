import { BaseEditor, Descendant } from 'slate';
import { ReactEditor } from 'slate-react';
import { HistoryEditor } from 'slate-history';

export type MarkType = 'bold' | 'italic' | 'underline' | 'strikethrough';
export type BlockType = 'paragraph' | 'heading-one' | 'heading-two' | 'block-quote';

export type FallacyMark = {
  id: string;
  fallacyId: string;
  color: string;
};

export type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fallacyId?: string;
  fallacyColor?: string;
  fallacyMarks?: FallacyMark[];
};

export type ParagraphElement = {
  type: 'paragraph';
  children: CustomText[];
};

export type HeadingOneElement = {
  type: 'heading-one';
  children: CustomText[];
};

export type HeadingTwoElement = {
  type: 'heading-two';
  children: CustomText[];
};

export type BlockQuoteElement = {
  type: 'block-quote';
  children: CustomText[];
};

export type CustomElement =
  | ParagraphElement
  | HeadingOneElement
  | HeadingTwoElement
  | BlockQuoteElement;

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

export const DEFAULT_INITIAL_VALUE: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];
