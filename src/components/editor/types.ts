import { BaseEditor, Descendant } from 'slate';
import { ReactEditor } from 'slate-react';
import { HistoryEditor } from 'slate-history';

export type MarkType = 'bold' | 'italic' | 'underline' | 'strikethrough';
export type BlockType = 'paragraph' | 'heading-one' | 'heading-two' | 'block-quote';

export type FallacyMark = {
  id: string;
  fallacyId: string;
  color: string;
  appliedAt: number;
};

export type RhetoricMark = {
  id: string;
  rhetoricId: string;
  color: string;
  appliedAt: number;
};

export type StructuralMark = {
  id: string;
  markupId: string; // e.g., 'claim', 'evidence', 'source-needed'
  color: string;
  appliedAt: number;
  metadata?: {
    sourceUrl?: string;
    sourceAuthor?: string;
    sourceDate?: string;
    sourcePublication?: string;
    verificationStatus?: 'unverified' | 'verified' | 'disputed';
    linkedClaimId?: string; // For linking evidence to claims
  };
};

export type CommentMark = {
  id: string;
  commentId: string;
  appliedAt: number;
};

// Union type for any annotation mark (fallacy or rhetoric)
export type AnnotationMark = 
  | (FallacyMark & { type: 'fallacy' })
  | (RhetoricMark & { type: 'rhetoric' })
  | (StructuralMark & { type: 'structural' })
  | (CommentMark & { type: 'comment' });

export type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fallacyId?: string;
  fallacyColor?: string;
  fallacyMarks?: FallacyMark[];
  rhetoricMarks?: RhetoricMark[];
  structuralMarks?: StructuralMark[];
  commentMarks?: CommentMark[];
};

export type ParagraphElement = {
  type: 'paragraph';
  speakerId?: string; // Optional speaker assignment
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
  speakerId?: string; // Optional speaker assignment
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
