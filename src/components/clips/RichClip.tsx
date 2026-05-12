import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Clip } from '../../hooks/useRoom';
import { useAppStore } from '../../stores/appStore';

export default function RichClip({ clip, onDelete }: { clip: Clip; onDelete?: () => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: clip.content ?? '',
    editable: false,
  });

  const pushToast = useAppStore((s) => s.pushToast);
  const copy = async () => {
    if (!clip.content) return;
    const html = clip.content;
    // Render the HTML once to extract a clean text representation
    // (so plain-text destinations get readable text, not tags).
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.innerText || tmp.textContent || '';

    try {
      // Modern multi-MIME clipboard. Word/Notion/Gmail get the
      // formatted version; plain editors get plain text. Browser
      // picks the right representation per paste destination.
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      pushToast({ kind: 'success', title: 'Copied to clipboard' });
    } catch {
      // Some browsers block ClipboardItem outside user gestures or in
      // insecure contexts — fall back to plain text.
      try {
        await navigator.clipboard.writeText(text);
        pushToast({ kind: 'success', title: 'Copied as plain text' });
      } catch {
        pushToast({ kind: 'error', title: 'Could not copy' });
      }
    }
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copy}
            className="rounded-btn px-2 py-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
            style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
          >
            Copy
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete clip"
              title="Delete"
              className="flex h-[26px] w-[26px] items-center justify-center rounded-btn text-sm leading-none text-text-tertiary transition-colors hover:text-text-primary"
              style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="tiptap-rich text-sm" style={{ color: 'var(--text-primary)' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
