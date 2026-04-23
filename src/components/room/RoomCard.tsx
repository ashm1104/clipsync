import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

type Props = {
  slug: string | null;
};

export default function RoomCard({ slug }: Props) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const link = slug ? `${window.location.origin}/r/${slug}` : '';

  const copy = async (kind: 'code' | 'link') => {
    if (!slug) return;
    const text = kind === 'code' ? slug : link;
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div
      className="rounded-card bg-bg-card p-4"
      style={{ border: '0.5px solid var(--border-default)' }}
    >
      <div className="mb-1 text-xs uppercase tracking-wider text-text-tertiary">Room code</div>
      <div
        className="font-mono text-text-primary"
        style={{ fontSize: '26px', letterSpacing: '0.13em', fontWeight: 500 }}
      >
        {slug ?? '——————'}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!slug}
          onClick={() => copy('code')}
          className="rounded-btn px-3 py-2 text-sm text-text-primary transition-colors disabled:opacity-40"
          style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
        >
          {copied === 'code' ? 'Copied' : 'Copy code'}
        </button>
        <button
          type="button"
          disabled={!slug}
          onClick={() => copy('link')}
          className="rounded-btn px-3 py-2 text-sm text-text-primary transition-colors disabled:opacity-40"
          style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
        >
          {copied === 'link' ? 'Copied' : 'Copy link'}
        </button>
      </div>

      <div
        className="mt-3 flex items-center justify-center rounded-btn p-3"
        style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
      >
        {slug ? (
          <QRCodeSVG value={link} size={140} bgColor="transparent" fgColor="#1a1a18" />
        ) : (
          <div className="h-[140px] w-[140px]" />
        )}
      </div>

      <p className="mt-3 text-xs text-text-tertiary">
        Scan the QR or enter the code on another device to receive your clipboard.
      </p>
    </div>
  );
}
