import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Minus,
  Table,
  Plus,
  Trash2,
  RowsIcon,
  Columns,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  editor: Editor;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  tooltip,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'h-8 w-8 p-0',
            isActive && 'bg-accent text-accent-foreground'
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-border mx-1" />;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [linkUrl, setLinkUrl] = useState('');

  const addLink = () => {
    const url = window.prompt('Enter URL:', linkUrl);
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30">
        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          tooltip="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          tooltip="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          tooltip="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          tooltip="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          tooltip="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          tooltip="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          tooltip="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          tooltip="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          tooltip="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          tooltip="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          tooltip="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          tooltip="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Link */}
        <ToolbarButton
          onClick={editor.isActive('link') ? removeLink : addLink}
          isActive={editor.isActive('link')}
          tooltip={editor.isActive('link') ? 'Remove Link' : 'Add Link'}
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>

        {/* Horizontal Rule */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          tooltip="Horizontal Divider"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Table Controls */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2 gap-1',
                editor.isActive('table') && 'bg-accent text-accent-foreground'
              )}
            >
              <Table className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">Table</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={insertTable}>
              <Plus className="h-4 w-4 mr-2" />
              Insert Table
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              disabled={!editor.can().addColumnBefore()}
            >
              <Columns className="h-4 w-4 mr-2" />
              Add Column Before
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              disabled={!editor.can().addColumnAfter()}
            >
              <Columns className="h-4 w-4 mr-2" />
              Add Column After
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteColumn().run()}
              disabled={!editor.can().deleteColumn()}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Column
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowBefore().run()}
              disabled={!editor.can().addRowBefore()}
            >
              <RowsIcon className="h-4 w-4 mr-2" />
              Add Row Before
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowAfter().run()}
              disabled={!editor.can().addRowAfter()}
            >
              <RowsIcon className="h-4 w-4 mr-2" />
              Add Row After
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteRow().run()}
              disabled={!editor.can().deleteRow()}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Row
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              disabled={!editor.can().toggleHeaderRow()}
            >
              Toggle Header Row
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteTable().run()}
              disabled={!editor.can().deleteTable()}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
