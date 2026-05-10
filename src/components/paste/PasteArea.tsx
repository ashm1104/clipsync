import { useCallback, useMemo, useRef, useState } from 'react';
import SendButton from './SendButton';
import {
  detectType,
  detectLanguage,
  SUPPORTED_LANGUAGES,
  type ClipType,
} from '../../lib/contentDetector';

type Override = {
  type: 'text' | 'code' | 'url' | 'rich_text';
  language: string | null;
} | null;

// Override is forwarded to the consumer so it bypasses re-detection in
// the send hook. Consumers that don't care about overrides can ignore it.
type SendFn = (
  text: string,
  hasHtml: boolean,
  htmlContent?: string,
  override?: Override
) => Promise<void> | void;

type Props = {
  onSend: SendFn;
  onImagePaste?: (file: File) => Promise<void> | void;
  live?: boolean;
};

const TYPE_LABEL: Record<ClipType, string> = {
  text: 'Text',
  code: 'Code',
  url: 'URL',
  rich_text: 'Rich text',
  image: 'Image',
};

export default function PasteArea({ onSend, onImagePaste, live }: Props) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [override, setOverride] = useState<Override>(null);
  const [showPicker, setShowPicker] = useState(false);
  const hasHtmlRef = useRef(false);
  const htmlRef = useRef<string>('');

  const detected = useMemo(() => {
    if (!value.trim()) return null;
    const t = detectType(value, hasHtmlRef.current);
    const lang = t === 'code' ? detectLanguage(value) : null;
    return { type: t, language: lang };
  }, [value]);

  const effective = override ?? detected;

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (onImagePaste) {
        const fromFiles = Array.from(e.clipboardData.files ?? []).find((f) =>
          f.type.startsWith('image/')
        );
        let imageFile: File | null = fromFiles ?? null;
        if (!imageFile && e.clipboardData.items) {
          for (const item of Array.from(e.clipboardData.items)) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
              const blob = item.getAsFile();
              if (blob) {
                const ext = item.type.split('/')[1] || 'png';
                imageFile = new File([blob], `paste.${ext}`, { type: item.type });
                break;
              }
            }
          }
        }
        if (imageFile) {
          e.preventDefault();
          onImagePaste(imageFile);
          return;
        }
      }
      const html = e.clipboardData.getData('text/html');
      hasHtmlRef.current = !!html && /<[a-z][\s\S]*>/i.test(html);
      htmlRef.current = hasHtmlRef.current ? html : '';
      // Reset any previous override — fresh paste should redetect.
      setOverride(null);
    },
    [onImagePaste]
  );

  const submit = useCallback(async () => {
    const text = value;
    if (!text.trim()) return;
    setBusy(true);
    try {
      // Build override for sendText: text/code/url/rich_text only —
      // image isn't a textarea path.
      const ovr: Override = override
        ? { type: override.type, language: override.language }
        : null;
      await onSend(text, hasHtmlRef.current, htmlRef.current || undefined, ovr);
      setValue('');
      hasHtmlRef.current = false;
      htmlRef.current = '';
      setOverride(null);
      setShowPicker(false);
    } finally {
      setBusy(false);
    }
  }, [value, onSend, override]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  const setType = (t: 'text' | 'code' | 'url') => {
    if (t === 'code') {
      setOverride({ type: 'code', language: override?.language ?? detected?.language ?? 'plaintext' });
    } else {
      setOverride({ type: t, language: null });
    }
  };
  const setLang = (lang: string) => {
    setOverride({ type: 'code', language: lang });
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

      {/* Detected-type strip — only shown when there's content */}
      {effective && value.trim().length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>Detected:</span>
          <span
            className="rounded-pill px-2 py-0.5"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
          >
            {TYPE_LABEL[effective.type]}
            {effective.type === 'code' && effective.language && effective.language !== 'plaintext'
              ? ` · ${effective.language}`
              : ''}
          </span>
          {effective.type === 'code' &&
            (!effective.language || effective.language === 'plaintext') && (
              <span style={{ color: 'var(--amber-text, #633806)' }}>
                language unsure — pick one for syntax highlighting
              </span>
            )}
          <button
            type="button"
            onClick={() => setShowPicker((s) => !s)}
            className="underline-offset-2 transition-colors hover:underline"
          >
            {showPicker ? 'cancel' : override ? 'change' : 'change'}
          </button>
          {override && (
            <button
              type="button"
              onClick={() => {
                setOverride(null);
                setShowPicker(false);
              }}
              className="underline-offset-2 transition-colors hover:underline"
            >
              auto
            </button>
          )}
        </div>
      )}

      {showPicker && (
        <div className="mt-2 flex flex-col gap-2 rounded-btn p-3" style={{ background: 'var(--bg-surface)' }}>
          <div className="flex flex-wrap gap-1.5">
            {(['text', 'code', 'url'] as const).map((t) => {
              const active = (effective?.type ?? 'text') === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className="rounded-pill px-2.5 py-1 text-xs transition-colors"
                  style={{
                    background: active ? 'var(--bg-card)' : 'transparent',
                    border: `0.5px solid ${active ? 'var(--border-default)' : 'var(--border-subtle)'}`,
                    color: 'var(--text-primary)',
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  {TYPE_LABEL[t]}
                </button>
              );
            })}
          </div>
          {effective?.type === 'code' && (
            <select
              value={effective.language ?? 'plaintext'}
              onChange={(e) => setLang(e.target.value)}
              className="rounded-btn px-2 py-1.5 text-xs outline-none"
              style={{
                background: 'var(--bg-card)',
                border: '0.5px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-text-tertiary">
          {value.length > 0 ? `${value.length} chars` : 'Cmd/Ctrl + Enter to send'}
        </span>
        <SendButton onClick={submit} disabled={!value.trim()} live={live} busy={busy} />
      </div>
    </div>
  );
}
