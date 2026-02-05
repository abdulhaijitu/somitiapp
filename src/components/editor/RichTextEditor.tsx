import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { EditorToolbar } from './EditorToolbar';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  content,
  onChange,
  disabled = false,
  placeholder = 'Start writing...',
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-border w-full',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border bg-muted font-semibold p-2 text-left',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border p-2',
        },
      }),
    ],
    content,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose-base dark:prose-invert max-w-none',
          'min-h-[300px] p-4 focus:outline-none',
          'prose-headings:font-semibold prose-headings:text-foreground',
          'prose-p:text-foreground prose-p:leading-relaxed',
          'prose-ul:list-disc prose-ol:list-decimal',
          'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic',
          'prose-table:border-collapse prose-table:w-full',
          'prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-2 prose-th:text-left prose-th:font-semibold',
          'prose-td:border prose-td:border-border prose-td:p-2',
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update editable state when disabled changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  if (!editor) {
    return (
      <div className="animate-pulse bg-muted rounded-lg h-[400px]" />
    );
  }

  return (
    <div className={cn('border border-border rounded-lg overflow-hidden bg-background', className)}>
      {!disabled && <EditorToolbar editor={editor} />}
      <div className="bg-card">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export { type Editor };
