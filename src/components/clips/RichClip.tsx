import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Clip } from '../../hooks/useRoom';

export default function RichClip({ clip }: { clip: Clip }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: clip.content ?? '',
    editable: false,
  });

  const copy = async () => {
    if (clip.content) await navigator.clipboard.writeText(clip.content);
  };

  return (
    <div
      className="rounded-card bg-bg-card p-4"
      style={{ border: '0.5px solid var(--border-default)' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className="rounded-pill px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
          style={{ background: '#FAEEDA', color: '#633806' }}
        >
          rich text
        </span>
        <button
          type="button"
          onClick={copy}
          className="rounded-btn px-2 py-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
          style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
        >
          Copy HTML
        </button>
      </div>
      <div className="tiptap-rich text-sm" style={{ color: 'var(--text-primary)' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
