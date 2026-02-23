import React, { useCallback, useMemo } from 'react';
import { createEditor, Descendant, BaseEditor } from 'slate';
import { Slate, Editable, withReact, ReactEditor, RenderLeafProps } from 'slate-react';
import { withHistory, HistoryEditor } from 'slate-history';

type CustomText = {
  text: string;
  fallacyId?: string;
  fallacyColor?: string;
};

type CustomElement = {
  type: 'paragraph';
  children: CustomText[];
};

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

interface DebateEditorProps {
  initialValue?: Descendant[];
  onChange?: (value: Descendant[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const DEFAULT_INITIAL_VALUE: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

const Leaf: React.FC<RenderLeafProps> = ({ attributes, children, leaf }) => {
  let style: React.CSSProperties = {};

  if (leaf.fallacyColor) {
    style = {
      backgroundColor: leaf.fallacyColor,
      padding: '2px 0',
      borderRadius: '2px',
    };
  }

  return (
    <span {...attributes} style={style}>
      {children}
    </span>
  );
};

export const DebateEditor: React.FC<DebateEditorProps> = ({
  initialValue = DEFAULT_INITIAL_VALUE,
  onChange,
  placeholder = 'Start typing or paste debate text here...',
  readOnly = false,
}) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);

  const handleChange = useCallback(
    (value: Descendant[]) => {
      onChange?.(value);
    },
    [onChange]
  );

  return (
    <div className="h-full flex flex-col">
      <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
        <Editable
          className="flex-1 p-4 focus:outline-none prose prose-sm max-w-none"
          renderLeaf={renderLeaf}
          placeholder={placeholder}
          readOnly={readOnly}
          spellCheck
        />
      </Slate>
    </div>
  );
};
