type Tab = { key: string; label: string };

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
};

// Top tab strip shown on mobile only. Mirrors the pill-tab pattern used
// on Settings — same component shape, different palette context.
export default function MobileTabs({ tabs, active, onChange, className = '' }: Props) {
  return (
    <div
      className={`grid gap-2 md:hidden ${className}`}
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className="rounded-btn px-3 py-2 text-sm transition-colors"
            style={{
              background: isActive ? 'var(--bg-card)' : 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: isActive
                ? '0.5px solid var(--border-default)'
                : '0.5px solid var(--border-subtle)',
              fontWeight: isActive ? 500 : 400,
            }}
            aria-pressed={isActive}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
