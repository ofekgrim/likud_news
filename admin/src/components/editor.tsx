'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignRight,
  AlignCenter,
  Link as LinkIcon,
  ImagePlus,
  Undo2,
  Redo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ content, onChange, placeholder, className }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder || 'התחל לכתוב...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'min-h-[300px] p-4 text-right focus:outline-none',
        dir: 'rtl',
      },
    },
  });

  // Sync content from props when article loads asynchronously
  useEffect(() => {
    if (editor && content && !editor.isDestroyed) {
      const currentHtml = editor.getHTML();
      // Only update if content differs and isn't the default empty paragraph
      if (currentHtml !== content && (currentHtml === '<p></p>' || currentHtml === '')) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('קישור לתמונה:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('קישור:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
  };

  return (
    <div className={cn('border border-gray-200 rounded-lg overflow-hidden bg-white', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-200 bg-gray-50/50">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          tooltip="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          tooltip="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          tooltip="H2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          tooltip="H3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          tooltip="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          tooltip="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          tooltip="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          tooltip="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          tooltip="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton active={editor.isActive('link')} onClick={addLink} tooltip="Link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={false} onClick={addImage} tooltip="Image">
          <ImagePlus className="h-4 w-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().undo().run()}
          tooltip="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().redo().run()}
          tooltip="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>
      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}

function Separator() {
  return <div className="w-px h-6 bg-gray-200 mx-1" />;
}

function ToolbarButton({
  active,
  onClick,
  children,
  tooltip,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        active
          ? 'bg-[#0099DB] text-white'
          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
      )}
    >
      {children}
    </button>
  );
}
