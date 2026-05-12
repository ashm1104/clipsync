import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import PasteArea from '../components/paste/PasteArea';
import ImageDrop from '../components/paste/ImageDrop';
import RoomCard from '../components/room/RoomCard';
import ClipFeed from '../components/clips/ClipFeed';
import TimerCard from '../components/room/TimerCard';
import HistoryStrip from '../components/room/HistoryStrip';
import MyRoomsPanel from '../components/room/MyRoomsPanel';
import DevicesPanel from '../components/room/DevicesPanel';
import MobileTabs from '../components/layout/MobileTabs';
import Footer from '../components/layout/Footer';
import { useDeviceRegistration } from '../hooks/useDeviceRegistration';
import { supabase } from '../lib/supabase';
import AmberBanner from '../components/room/AmberBanner';
import ExpiredRoomCard from '../components/room/ExpiredRoomCard';
import { clearCurrentRoomSlug } from '../lib/localStorage';
import { useRoom } from '../hooks/useRoom';
import { usePersonalClipboard } from '../hooks/usePersonalClipboard';
import { useAnonAuth } from '../hooks/useAnonAuth';
import { useRoomTimer } from '../hooks/useTimer';
import { useAppStore } from '../stores/appStore';

const AMBER_NUDGE_PREFIX = 'pastio.amberNudge:';

function useNowTicker(intervalMs = 5000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

function AnonHome() {
  useNowTicker(1000);
  const { room, clips: allClips, sendText, sendImage, sendFile } = useRoom();
  const myUserId = useAppStore((s) => s.userId);
  const isAnon = useAppStore((s) => s.isAnonymous);
  const openSignIn = useAppStore((s) => s.openSignIn);
  const expiresAtMs = room ? new Date(room.expires_at).getTime() : null;
  const isRoomExpired = expiresAtMs != null && expiresAtMs <= Date.now();
  const { state: timerState } = useRoomTimer(expiresAtMs);

  // Spec §8: when timer turns amber AND user has content AND is anon,
  // auto-open the SignInModal once per room as the conversion nudge.
  // Keyed on room id so a brand-new room re-arms the nudge.
  useEffect(() => {
    if (!isAnon) return;
    if (!room) return;
    if (allClips.length === 0) return;
    if (timerState !== 'amber' && timerState !== 'red') return;
    const key = AMBER_NUDGE_PREFIX + room.id;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    openSignIn();
  }, [isAnon, room, allClips.length, timerState, openSignIn]);
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
    if (code.length >= 3) navigate(`/r/${code}`);
  };

  const [mobileTab, setMobileTab] = useState<'clipboard' | 'room'>('clipboard');
  const showOn = (t: 'clipboard' | 'room') =>
    mobileTab === t ? 'flex' : 'hidden md:flex';

  return (
    <main
      className="mx-auto grid w-full max-w-[960px] grid-cols-1 gap-[18px] px-4 py-[18px] md:grid-cols-[1fr_268px] md:px-[22px] md:py-[20px]"
    >
      <MobileTabs
        tabs={[{ key: 'clipboard', label: 'Clipboard' }, { key: 'room', label: 'Room' }]}
        active={mobileTab}
        onChange={(k) => setMobileTab(k as 'clipboard' | 'room')}
        className="md:col-span-2"
      />

      <section className={`${showOn('clipboard')} flex-col gap-[18px]`}>
        {isRoomExpired && (
          <ExpiredRoomCard
            slug={room?.slug}
            onStartNew={() => {
              clearCurrentRoomSlug();
              window.location.reload();
            }}
          />
        )}
        {!isRoomExpired && room && (
          <button
            type="button"
            onClick={() => setMobileTab('room')}
            className="flex items-center justify-between rounded-card bg-bg-card px-4 py-2.5 text-sm md:hidden"
            style={{ border: '0.5px solid var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <span className="flex items-center gap-2">
              <span className="sync-dot-live" />
              <span>
                Live · <span className="font-mono" style={{ letterSpacing: '0.08em', color: 'var(--text-primary)' }}>{room.custom_slug ?? room.slug}</span>
              </span>
            </span>
            <span style={{ color: 'var(--text-tertiary)' }}>Share →</span>
          </button>
        )}
        {!isRoomExpired && <AmberBanner expiresAtMs={expiresAtMs} />}
        {!isRoomExpired && (
          <>
            <PasteArea onSend={sendText} onImagePaste={sendImage} live={!!room} />
            <ImageDrop onImage={sendImage} onFile={sendFile} />
          </>
        )}
        {!isRoomExpired && (
          <ClipFeed
            clips={clips}
            emptyLabel="Clips received from others will appear here."
          />
        )}
      </section>

      <aside className={`${showOn('room')} flex-col gap-[18px]`}>
        <form
          onSubmit={handleJoin}
          className="rounded-card bg-bg-card p-4"
          style={{ border: '0.5px solid var(--border-default)' }}
        >
          <div className="text-xs uppercase tracking-wider text-text-tertiary">Join a room</div>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/[^a-z0-9-]/gi, ''))}
              placeholder="code or custom"
              maxLength={50}
              className="min-w-0 flex-1 rounded-btn bg-bg-surface px-2 py-1.5 font-mono text-sm outline-none placeholder:text-text-tertiary"
              style={{ border: '0.5px solid var(--border-subtle)', letterSpacing: '0.05em', color: 'var(--text-primary)' }}
            />
            <button
              type="submit"
              disabled={joinCode.trim().length < 3}
              className="shrink-0 rounded-btn px-3 py-1.5 text-sm transition-colors disabled:opacity-40"
              style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              Join
            </button>
          </div>
        </form>
        {!isRoomExpired && room && (
          <>
            <RoomCard
              slug={room.slug}
              roomId={room.id}
              ownerId={room.owner_id}
              onDeleted={() => {
                clearCurrentRoomSlug();
                window.location.reload();
              }}
            />
            <TimerCard expiresAtMs={expiresAtMs} />
            <HistoryStrip roomSlugs={[room?.slug, room?.custom_slug]} />
          </>
        )}
        {!isRoomExpired && !room && (
          <div
            className="rounded-card p-5 text-center"
            style={{
              background: 'var(--green-light, #EAF3DE)',
              border: '0.5px solid #3B6D11',
              color: 'var(--text-primary)',
            }}
          >
            <p className="text-sm font-medium">Your room appears here</p>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              Paste anything on the Clipboard tab — we'll spin up a room with a code and QR you can share.
            </p>
            <button
              type="button"
              onClick={() => setMobileTab('clipboard')}
              className="mt-3 rounded-btn px-3 py-1.5 text-xs font-medium text-white transition-colors md:hidden"
              style={{ background: '#3B6D11' }}
            >
              Go to Clipboard →
            </button>
          </div>
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

function JoinRoomCard() {
  const [code, setCode] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toLowerCase();
    if (c.length >= 3) {
      window.open(`/r/${c}`, '_blank', 'noopener,noreferrer');
      setCode('');
    }
  };
  return (
    <form
      onSubmit={submit}
      className="rounded-card p-4"
      style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)' }}
    >
      <div className="text-xs uppercase tracking-wider text-text-tertiary">Join room</div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^a-z0-9-]/gi, ''))}
          placeholder="code or custom"
          maxLength={50}
          className="flex-1 rounded-btn bg-bg-surface px-2 py-1.5 font-mono text-sm outline-none placeholder:text-text-tertiary"
          style={{ border: '0.5px solid var(--border-subtle)', color: 'var(--text-primary)', letterSpacing: '0.05em' }}
        />
        <button
          type="submit"
          disabled={code.trim().length < 3}
          className="rounded-btn px-3 py-1.5 text-sm transition-colors disabled:opacity-40"
          style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', color: 'var(--text-primary)' }}
        >
          Join
        </button>
      </div>
    </form>
  );
}

function LoggedInHome() {
  useDeviceRegistration();
  const { clips, sendText, sendImage, sendFile } = usePersonalClipboard();
  const plan = useAppStore((s) => s.plan);
  const userId = useAppStore((s) => s.userId);
  const pushToast = useAppStore((s) => s.pushToast);

  const clearAllPersonal = async () => {
    if (!userId || !clips.length) return;
    if (!window.confirm('Clear all clips from your Personal Sync? This cannot be undone.')) return;
    const { error } = await supabase.from('personal_clips').delete().eq('user_id', userId);
    if (error) {
      pushToast({ kind: 'error', title: 'Could not clear', body: error.message });
      return;
    }
    pushToast({ kind: 'success', title: 'Personal Sync cleared' });
  };

  const [mobileTab, setMobileTab] = useState<'clipboard' | 'room'>('clipboard');
  const showOn = (t: 'clipboard' | 'room') =>
    mobileTab === t ? 'flex' : 'hidden md:flex';

  return (
    <main
      className="mx-auto grid w-full max-w-[960px] grid-cols-1 gap-[18px] px-4 py-[18px] md:grid-cols-[1fr_268px] md:px-[22px] md:py-[20px]"
    >
      <MobileTabs
        tabs={[
          { key: 'clipboard', label: 'Clipboard' },
          { key: 'room', label: 'Devices & rooms' },
        ]}
        active={mobileTab}
        onChange={(k) => setMobileTab(k as 'clipboard' | 'room')}
        className="md:col-span-2"
      />

      <section className={`${showOn('clipboard')} flex-col gap-[18px]`}>
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
        <ImageDrop onImage={sendImage} onFile={sendFile} />
      </section>

      <aside className={`${showOn('room')} flex-col gap-[18px] md:row-span-2 md:col-start-2 md:row-start-1`}>
        <NewRoomCard />
        <JoinRoomCard />
        <MyRoomsPanel />
        <DevicesPanel />
      </aside>

      <section className={`${showOn('clipboard')} flex-col gap-[18px] md:col-start-1 md:row-start-2`}>
        {clips.length > 0 && (
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span>{clips.length} clip{clips.length === 1 ? '' : 's'}</span>
            <button
              type="button"
              onClick={clearAllPersonal}
              className="underline-offset-2 transition-colors hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
        <ClipFeed
          clips={clips}
          source="personal_clips"
          blurOlderThan={plan === 'pro' ? null : Date.now() - 24 * 60 * 60 * 1000}
        />
      </section>
    </main>
  );
}

export default function Home() {
  useAnonAuth();
  const isAnon = useAppStore((s) => s.isAnonymous);
  const userId = useAppStore((s) => s.userId);

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <div className="flex-1">
        {isAnon || !userId ? <AnonHome /> : <LoggedInHome />}
      </div>
      <Footer />
    </div>
  );
}
