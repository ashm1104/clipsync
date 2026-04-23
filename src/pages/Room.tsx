import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import RoomCard from '../components/room/RoomCard';
import PasteArea from '../components/paste/PasteArea';
import ImageDrop from '../components/paste/ImageDrop';
import ClipFeed from '../components/clips/ClipFeed';
import { useRoom } from '../hooks/useRoom';
import { useAnonAuth } from '../hooks/useAnonAuth';

export default function Room() {
  useAnonAuth();
  const { slug = '' } = useParams();
  const { room, clips, loading, notFound, sendText, sendImage } = useRoom(slug);

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
            <span className="sync-dot-live" />
            <span>Live · room</span>
            <span className="font-mono" style={{ letterSpacing: '0.1em' }}>
              {room?.slug}
            </span>
          </div>
          <ClipFeed clips={clips} emptyLabel="Waiting for the first clip…" />
          <PasteArea onSend={sendText} onImagePaste={sendImage} live={!!room} />
          <ImageDrop onImage={sendImage} />
        </section>

        <aside className="flex flex-col gap-[18px]">
          <RoomCard slug={room?.slug ?? null} />
        </aside>
      </main>
    </div>
  );
}
