type Props = {
  onClick: () => void;
  disabled?: boolean;
  live?: boolean;
  busy?: boolean;
};

export default function SendButton({ onClick, disabled, live, busy }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className="send-btn inline-flex items-center gap-1.5 rounded-btn px-4 py-[7px] font-medium text-white transition-colors"
      style={{
        background: disabled ? 'var(--bg-surface)' : '#3B6D11',
        color: disabled ? 'var(--text-tertiary)' : 'white',
        border: disabled ? '0.5px solid var(--border-subtle)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = '#27500A';
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = '#3B6D11';
      }}
    >
      {live && !disabled && <span className="sync-dot-live" />}
      <span>{busy ? 'Sending…' : 'Send'}</span>
    </button>
  );
}
