import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import PasteArea from '../components/paste/PasteArea';
import ImageDrop from '../components/paste/ImageDrop';
import RoomCard from '../components/room/RoomCard';
import ClipFeed from '../components/clips/ClipFeed';
import TimerCard from '../components/room/TimerCard';
import HistoryStrip from '../components/room/HistoryStrip';
import AmberBanner from '../components/room/AmberBanner';
import PersonalHistory from '../components/room/PersonalHistory';
import { useRoom } from '../hooks/useRoom';
import { useAnonAuth } from '../hooks/useAnonAuth';
import { useLocalClips } from '../hooks/useLocalClips';
import { useAppStore } from '../stores/appStore';

export default function Home() {
  useAnonAuth();
  const { room, clips, sendText, sendImage } = useRoom();
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();
  const isAnon = useAppStore((s) => s.isAnonymous);
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
    <div className="min-h-full">
      <Navbar />
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
          {isAnon && <AmberBanner />}

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
          {isAnon ? (
            <>
              <TimerCard createdAtMs={earliestCreatedAt} />
              <HistoryStrip />
            </>
          ) : (
            <PersonalHistory />
          )}
        </aside>
      </main>
    </div>
  );
}
