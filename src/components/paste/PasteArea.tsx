import { useCallback, useRef, useState } from 'react';
import SendButton from './SendButton';

type SendFn = (
  text: string,
  hasHtml: boolean,
  htmlContent?: string
) => Promise<void> | void;

type Props = {
  onSend: SendFn;
  onImagePaste?: (file: File) => Promise<void> | void;
  live?: boolean;
};

export default function PasteArea({ onSend, onImagePaste, live }: Props) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const hasHtmlRef = useRef(false);
  const htmlRef = useRef<string>('');

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      // Image paste → hand off to image handler if provided.
      const files = e.clipboardData.files;
      if (files && files.length && onImagePaste) {
        const first = Array.from(files).find((f) => f.type.startsWith('image/'));
        if (first) {
          e.preventDefault();
          onImagePaste(first);
          return;
        }
      }
      const html = e.clipboardData.getData('text/html');
      hasHtmlRef.current = !!html && /<[a-z][\s\S]*>/i.test(html);
      htmlRef.current = hasHtmlRef.current ? html : '';
    },
    [onImagePaste]
  );

  const submit = useCallback(async () => {
    const text = value;
    if (!text.trim()) return;
    setBusy(true);
    try {
      await onSend(text, hasHtmlRef.current, htmlRef.current || undefined);
      setValue('');
      hasHtmlRef.current = false;
      htmlRef.current = '';
    } finally {
      setBusy(false);
    }
  }, [value, onSend]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className="rounded-card bg-bg-card p-4"
      style={{ border: '0.5px solid var(--border-default)' }}
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={handleKey}
        placeholder="Paste anything — text, code, a link, an image…"
        className="w-full resize-none bg-transparent outline-none placeholder:text-text-tertiary"
        rows={5}
        style={{ color: 'var(--text-primary)', fontFamily: 'DM Sans, system-ui, sans-serif' }}
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-text-tertiary">
          {value.length > 0 ? `${value.length} chars` : 'Cmd/Ctrl + Enter to send'}
        </span>
        <SendButton onClick={submit} disabled={!value.trim()} live={live} busy={busy} />
      </div>
    </div>
  );
}
