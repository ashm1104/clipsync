import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import RoomCard from '../components/room/RoomCard';
import PasteArea from '../components/paste/PasteArea';
import ImageDrop from '../components/paste/ImageDrop';
import ClipFeed from '../components/clips/ClipFeed';
import TimerCard from '../components/room/TimerCard';
import HistoryStrip from '../components/room/HistoryStrip';
import AmberBanner from '../components/room/AmberBanner';
import { useRoom } from '../hooks/useRoom';
import { useAnonAuth } from '../hooks/useAnonAuth';
import { useLocalClips } from '../hooks/useLocalClips';
import { useAppStore } from '../stores/appStore';
import { ANONYMOUS_TTL_MS } from '../lib/timer';

function useNowTicker(intervalMs = 1000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

export default function Room() {
  useAnonAuth();
  useNowTicker(1000);
  const { slug = '' } = useParams();
  const { room, clips: allClips, loading, notFound, sendText, sendImage } = useRoom(slug);
  const myUserId = useAppStore((s) => s.userId);
  const isAnon = useAppStore((s) => s.isAnonymous);
  const localClips = useLocalClips();

  if (loading) {
    return (
      <div className="min-h-full">
        <Navbar />
        <main className="mx-auto max-w-[960px] px-[22px] py-10 text-sm text-text-tertiary">
          Loading room {slug}…
        </main>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-full">
        <Navbar />
        <main className="mx-auto max-w-[640px] px-[22px] py-16 text-center">
          <h1 className="font-mono text-xl text-text-primary" style={{ letterSpacing: '0.08em' }}>
            room not found
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            The room code{' '}
            <span className="font-mono" style={{ letterSpacing: '0.1em' }}>
              {slug}
            </span>{' '}
            doesn't exist or has expired.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-btn px-4 py-2 text-sm text-white transition-colors"
            style={{ background: '#3B6D11' }}
          >
            Start your own
          </Link>
        </main>
      </div>
    );
  }

  const cutoff = Date.now() - ANONYMOUS_TTL_MS;
  // Feed = clips received from other users, within TTL.
  const feed = allClips.filter(
    (c) => new Date(c.created_at).getTime() > cutoff && c.user_id !== myUserId
  );
  const isRoomExpired = room ? new Date(room.expires_at).getTime() <= Date.now() : false;

  // Earliest in-window clip drives the countdown (matches Home behavior).
  const earliestRemote = allClips
    .filter((c) => new Date(c.created_at).getTime() > cutoff)
    .reduce<number | null>((min, c) => {
      const t = new Date(c.created_at).getTime();
      return min == null || t < min ? t : min;
    }, null);
  const earliestLocal = localClips.length
    ? localClips.reduce((m, c) => Math.min(m, c.createdAt), localClips[0].createdAt)
    : null;
  const earliestCreatedAt =
    earliestRemote != null && earliestLocal != null
      ? Math.min(earliestRemote, earliestLocal)
      : earliestRemote ?? earliestLocal;

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
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className={isRoomExpired ? 'sync-dot-expired' : 'sync-dot-live'} />
            <span>{isRoomExpired ? 'Expired · room' : 'Live · room'}</span>
            <span className="font-mono" style={{ letterSpacing: '0.1em' }}>
              {room?.slug}
            </span>
          </div>

          {isAnon && <AmberBanner />}

          <ClipFeed clips={feed} emptyLabel="Waiting for the first clip…" />

          {!isRoomExpired && (
            <>
              <PasteArea onSend={sendText} onImagePaste={sendImage} live={!!room} />
              <ImageDrop onImage={sendImage} />
            </>
          )}
        </section>

        <aside className="flex flex-col gap-[18px]">
          <RoomCard slug={room?.slug ?? null} />
          {isAnon && (
            <>
              <TimerCard createdAtMs={earliestCreatedAt} />
              <HistoryStrip />
            </>
          )}
        </aside>
      </main>
    </div>
  );
}
