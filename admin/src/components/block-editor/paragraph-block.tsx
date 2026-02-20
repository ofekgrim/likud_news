'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParagraphBlockEditorProps {
  text: string;
  onChange: (html: string) => void;
}

export function ParagraphBlockEditor({ text, onChange }: ParagraphBlockEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#0099DB] underline',
        },
      }),
    ],
    content: text,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'min-h-[80px] p-3 text-right focus:outline-none prose prose-sm max-w-none',
        dir: 'rtl',
      },
    },
  });

  // Sync content from props when it changes externally
  useEffect(() => {
    if (editor && text && !editor.isDestroyed) {
      const currentHtml = editor.getHTML();
      if (currentHtml !== text && (currentHtml === '<p></p>' || currentHtml === '')) {
        editor.commands.setContent(text);
      }
    }
  }, [editor, text]);

  if (!editor) return null;

  const handleAddLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('קישור:', previousUrl || 'https://');

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Mini toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/50">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          tooltip="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          tooltip="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('link')}
          onClick={handleAddLink}
          tooltip="Link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
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
          : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
      )}
    >
      {children}
    </button>
  );
}
