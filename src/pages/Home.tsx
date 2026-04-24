import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import PasteArea from '../components/paste/PasteArea';
import ImageDrop from '../components/paste/ImageDrop';
import RoomCard from '../components/room/RoomCard';
import ClipFeed from '../components/clips/ClipFeed';
import TimerCard from '../components/room/TimerCard';
import HistoryStrip from '../components/room/HistoryStrip';
import AmberBanner from '../components/room/AmberBanner';
import { useRoom } from '../hooks/useRoom';
import { usePersonalClipboard } from '../hooks/usePersonalClipboard';
import { useAnonAuth } from '../hooks/useAnonAuth';
import { useLocalClips } from '../hooks/useLocalClips';
import { useAppStore } from '../stores/appStore';
import { ANONYMOUS_TTL_MS } from '../lib/timer';

function useNowTicker(intervalMs = 5000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

function AnonHome() {
  useNowTicker(5000);
  const { room, clips: allClips, sendText, sendImage } = useRoom();
  const myUserId = useAppStore((s) => s.userId);
  const cutoff = Date.now() - ANONYMOUS_TTL_MS;
  // Feed shows clips from OTHERS only; own sent clips live in history sidebar.
  const clips = allClips.filter(
    (c) => new Date(c.created_at).getTime() > cutoff && c.user_id !== myUserId
  );
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();
  const localClips = useLocalClips();
  const earliestCreatedAt = localClips.length
    ? localClips.reduce((m, c) => Math.min(m, c.createdAt), localClips[0].createdAt)
    : null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toLowerCase();
    if (code.length === 6) navigate(`/r/${code}`);
  };

  return (
    <main
      className="mx-auto grid"
      style={{
        maxWidth: '960px',
        gridTemplateColumns: '1fr 268px',
        gap: '18px',
        padding: '20px 22px',
      }}
    >
      <section className="flex flex-col gap-[18px]">
        <AmberBanner />
        <form
          onSubmit={handleJoin}
          className="flex items-center gap-2 rounded-card bg-bg-card px-4 py-3"
          style={{ border: '0.5px solid var(--border-default)' }}
        >
          <span className="text-sm text-text-secondary">Have a code?</span>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="6 chars"
            maxLength={6}
            className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-text-tertiary"
            style={{ letterSpacing: '0.1em', color: 'var(--text-primary)' }}
          />
          <button
            type="submit"
            disabled={joinCode.trim().length !== 6}
            className="rounded-btn px-3 py-1.5 text-sm transition-colors disabled:opacity-40"
            style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            Join
          </button>
        </form>
        <div style={{ borderTop: '0.5px solid var(--border-subtle)' }} />
        <PasteArea onSend={sendText} onImagePaste={sendImage} live={!!room} />
        <ImageDrop onImage={sendImage} />
        <ClipFeed clips={clips} />
      </section>

      <aside className="flex flex-col gap-[18px]">
        <RoomCard slug={room?.slug ?? null} />
        <TimerCard createdAtMs={earliestCreatedAt} />
        <HistoryStrip />
      </aside>
    </main>
  );
}

function LoggedInHome() {
  const { clips, sendText, sendImage } = usePersonalClipboard();

  return (
    <main
      className="mx-auto grid"
      style={{
        maxWidth: '960px',
        gridTemplateColumns: '1fr 268px',
        gap: '18px',
        padding: '20px 22px',
      }}
    >
      <section className="flex flex-col gap-[18px]">
        <div
          className="rounded-card p-3 text-sm"
          style={{
            background: 'var(--bg-card)',
            border: '0.5px solid var(--border-default)',
            color: 'var(--text-secondary)',
          }}
        >
          <span
            className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
            style={{ background: '#3B6D11' }}
          />
          Personal Sync active — clips sync across all your signed-in devices.
        </div>
        <PasteArea onSend={sendText} onImagePaste={sendImage} live />
        <ImageDrop onImage={sendImage} />
        <ClipFeed clips={clips} />
      </section>

      <aside className="flex flex-col gap-[18px]">
        <div
          className="rounded-card p-4 text-sm"
          style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)' }}
        >
          <div className="mb-1 text-xs uppercase tracking-wider text-text-tertiary">Rooms</div>
          <div style={{ color: 'var(--text-secondary)' }}>
            Ad-hoc sharing rooms arrive in Phase 4.
          </div>
        </div>
      </aside>
    </main>
  );
}

export default function Home() {
  useAnonAuth();
  const isAnon = useAppStore((s) => s.isAnonymous);
  const userId = useAppStore((s) => s.userId);

  return (
    <div className="min-h-full">
      <Navbar />
      {isAnon || !userId ? <AnonHome /> : <LoggedInHome />}
    </div>
  );
}
