type Props = { slug?: string | null; onStartNew: () => void };

export default function ExpiredRoomCard({ slug, onStartNew }: Props) {
  return (
    <div
      className="rounded-card p-6 text-center"
      style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)' }}
    >
      <h2
        className="font-mono text-lg"
        style={{ color: 'var(--text-primary)', letterSpacing: '0.08em' }}
      >
        This room has expired
      </h2>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        {slug ? (
          <>
            Room{' '}
            <span className="font-mono" style={{ letterSpacing: '0.1em' }}>
              {slug}
            </span>{' '}
            has been permanently deleted.
          </>
        ) : (
          <>The clips in this session have expired.</>
        )}
      </p>
      <button
        type="button"
        onClick={onStartNew}
        className="mt-4 rounded-btn px-4 py-2 text-sm font-medium text-white transition-colors"
        style={{ background: '#3B6D11' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#27500A')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#3B6D11')}
      >
        Start a new session
      </button>
    </div>
  );
}
