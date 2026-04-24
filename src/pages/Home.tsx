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
import ExpiredRoomCard from '../components/room/ExpiredRoomCard';
import { clearCurrentRoomSlug } from '../lib/localStorage';
import { useRoom } from '../hooks/useRoom';
import { usePersonalClipboard } from '../hooks/usePersonalClipboard';
import { useAnonAuth } from '../hooks/useAnonAuth';
import { useAppStore } from '../stores/appStore';

function useNowTicker(intervalMs = 5000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

function AnonHome() {
  useNowTicker(1000);
  const { room, clips: allClips, sendText, sendImage } = useRoom();
  const myUserId = useAppStore((s) => s.userId);
  const expiresAtMs = room ? new Date(room.expires_at).getTime() : null;
  const isRoomExpired = expiresAtMs != null && expiresAtMs <= Date.now();
  // Feed shows clips from OTHERS only; own sent clips live in history sidebar.
  // Clips are hidden once the room itself expires.
  const clips = isRoomExpired
    ? []
    : allClips.filter((c) => c.user_id !== myUserId);
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();

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
        {isRoomExpired && (
          <ExpiredRoomCard
            slug={room?.slug}
            onStartNew={() => {
              clearCurrentRoomSlug();
              window.location.reload();
            }}
          />
        )}
        {!isRoomExpired && <AmberBanner expiresAtMs={expiresAtMs} />}
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
        {!isRoomExpired && (
          <>
            <PasteArea onSend={sendText} onImagePaste={sendImage} live={!!room} />
            <ImageDrop onImage={sendImage} />
          </>
        )}
        {!isRoomExpired && <ClipFeed clips={clips} />}
      </section>

      <aside className="flex flex-col gap-[18px]">
        {!isRoomExpired && (
          <>
            <RoomCard slug={room?.slug ?? null} />
            <TimerCard expiresAtMs={expiresAtMs} />
            <HistoryStrip expiresAtMs={expiresAtMs} />
          </>
        )}
      </aside>
    </main>
  );
}

function NewRoomCard() {
  const openCreateRoom = useAppStore((s) => s.openCreateRoom);
  return (
    <div
      className="rounded-card p-4"
      style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)' }}
    >
      <div className="text-xs uppercase tracking-wider text-text-tertiary">Rooms</div>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Spin up a shareable room for one-off collaborations.
      </p>
      <button
        type="button"
        onClick={openCreateRoom}
        className="mt-3 w-full rounded-btn px-3 py-2 text-sm font-medium text-white transition-colors"
        style={{ background: '#3B6D11' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#27500A')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#3B6D11')}
      >
        New room
      </button>
    </div>
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
        <NewRoomCard />
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
