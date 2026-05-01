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
import ExpiredRoomCard from '../components/room/ExpiredRoomCard';
import PasswordGate from '../components/room/PasswordGate';
import MobileTabs from '../components/layout/MobileTabs';
import Footer from '../components/layout/Footer';
import { useRoom } from '../hooks/useRoom';
import { useAnonAuth } from '../hooks/useAnonAuth';
import { useAppStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const { room, clips: allClips, loading, notFound, sendText, sendImage, sendFile } = useRoom(slug);
  const myUserId = useAppStore((s) => s.userId);
  const isAnon = useAppStore((s) => s.isAnonymous);
  const [mobileTab, setMobileTab] = useState<'clipboard' | 'room'>('clipboard');
  const unlockKey = room && myUserId ? `clipta.unlock.${room.id}.${myUserId}` : null;
  const [unlocked, setUnlocked] = useState<boolean>(() =>
    unlockKey ? sessionStorage.getItem(unlockKey) === '1' : false
  );
  useEffect(() => {
    if (unlockKey) setUnlocked(sessionStorage.getItem(unlockKey) === '1');
    else setUnlocked(false);
  }, [unlockKey]);

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

  const expiresAtMs = room ? new Date(room.expires_at).getTime() : null;
  const isRoomExpired = expiresAtMs != null && expiresAtMs <= Date.now();
  const isOwner = !!(room?.owner_id && myUserId && room.owner_id === myUserId);
  const needsPassword = !!room?.password_hash && !unlocked && !isOwner;

  if (needsPassword && room) {
    return (
      <div className="min-h-full">
        <Navbar />
        <PasswordGate
          slug={room.slug}
          expectedHash={room.password_hash!}
          onUnlock={() => {
            if (unlockKey) sessionStorage.setItem(unlockKey, '1');
            setUnlocked(true);
          }}
        />
      </div>
    );
  }
  // Feed = clips from other users, visible only while the room is live.
  const feed = isRoomExpired ? [] : allClips.filter((c) => c.user_id !== myUserId);

  if (isRoomExpired) {
    return (
      <div className="min-h-full">
        <Navbar />
        <main className="mx-auto max-w-[640px] px-[22px] py-16">
          <ExpiredRoomCard slug={room?.slug} onStartNew={() => navigate('/')} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main
        className="mx-auto grid w-full max-w-[960px] flex-1 grid-cols-1 gap-[18px] px-4 py-[18px] md:grid-cols-[1fr_268px] md:px-[22px] md:py-[20px]"
      >
        <MobileTabs
          tabs={[{ key: 'clipboard', label: 'Clipboard' }, { key: 'room', label: 'Room' }]}
          active={mobileTab}
          onChange={(k) => setMobileTab(k as 'clipboard' | 'room')}
          className="md:col-span-2"
        />

        <section
          className={`${mobileTab === 'clipboard' ? 'flex' : 'hidden md:flex'} flex-col gap-[18px]`}
        >
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className={isRoomExpired ? 'sync-dot-expired' : 'sync-dot-live'} />
            <span>{isRoomExpired ? 'Expired · room' : 'Live · room'}</span>
            <span className="font-mono" style={{ letterSpacing: '0.1em' }}>
              {room?.slug}
            </span>
          </div>

          {isAnon && <AmberBanner expiresAtMs={expiresAtMs} />}

          {!isRoomExpired && (
            <>
              <PasteArea onSend={sendText} onImagePaste={sendImage} live={!!room} />
              <ImageDrop onImage={sendImage} onFile={sendFile} />
            </>
          )}

          <ClipFeed
            clips={feed}
            emptyLabel={isRoomExpired ? 'Room expired.' : 'Waiting for the first clip…'}
          />
        </section>

        <aside
          className={`${mobileTab === 'room' ? 'flex' : 'hidden md:flex'} flex-col gap-[18px]`}
        >
          <RoomCard
            slug={room ? (room.custom_slug ?? room.slug) : null}
            roomId={room?.id}
            ownerId={room?.owner_id}
            onDeleted={() => navigate('/')}
          />
          <TimerCard expiresAtMs={expiresAtMs} />
          <HistoryStrip
            expiresAtMs={expiresAtMs}
            roomSlugs={[room?.slug, room?.custom_slug]}
          />
        </aside>
      </main>
      <Footer />
    </div>
  );
}
