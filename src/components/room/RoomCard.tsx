import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../stores/appStore';

type Props = {
  slug: string | null;
  // When provided + the current user owns the room, a small "Delete room"
  // action appears at the bottom of the card.
  roomId?: string | null;
  ownerId?: string | null;
  onDeleted?: () => void;
};

export default function RoomCard({ slug, roomId, ownerId, onDeleted }: Props) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const myUserId = useAppStore((s) => s.userId);
  const pushToast = useAppStore((s) => s.pushToast);
  const isOwner = !!(ownerId && myUserId && ownerId === myUserId);

  const link = slug ? `${window.location.origin}/r/${slug}` : '';

  const copy = async (kind: 'code' | 'link') => {
    if (!slug) return;
    const text = kind === 'code' ? slug : link;
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  };

  const deleteRoom = async () => {
    if (!roomId) return;
    if (!window.confirm('Delete this room? Clips and images will be removed for everyone.')) return;
    const { error } = await supabase.from('rooms').delete().eq('id', roomId);
    if (error) {
      pushToast({ kind: 'error', title: 'Could not delete room', body: error.message });
      return;
    }
    pushToast({ kind: 'success', title: 'Room deleted' });
    onDeleted?.();
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

      {isOwner && roomId && (
        <button
          type="button"
          onClick={deleteRoom}
          className="mt-3 w-full rounded-btn px-3 py-2 text-xs transition-colors"
          style={{
            background: 'var(--red-light, #FCEBEB)',
            color: 'var(--red-text, #A32D2D)',
            border: '0.5px solid var(--border-subtle)',
          }}
        >
          Delete room
        </button>
      )}
    </div>
  );
}
