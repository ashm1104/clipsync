import { useEffect } from 'react';
import { useAppStore, type Toast as ToastT, type ToastKind } from '../../stores/appStore';

const STYLES: Record<ToastKind, { bg: string; stroke: string; icon: string }> = {
  success: { bg: '#EAF3DE', stroke: '#3B6D11', icon: '✓' },
  info: { bg: '#E6F1FB', stroke: '#185FA5', icon: 'i' },
  warning: { bg: '#FAEEDA', stroke: '#BA7517', icon: '!' },
  error: { bg: '#FCEBEB', stroke: '#A32D2D', icon: '×' },
};

function ToastItem({ toast }: { toast: ToastT }) {
  const dismiss = useAppStore((s) => s.dismissToast);
  const style = STYLES[toast.kind];
  const autoDismiss = toast.kind === 'success' || toast.kind === 'info';

  useEffect(() => {
    if (!autoDismiss) return;
    const t = setTimeout(() => dismiss(toast.id), 4000);
    return () => clearTimeout(t);
  }, [autoDismiss, toast.id, dismiss]);

  return (
    <div
      className="flex items-start gap-3 rounded-card p-3 shadow-sm"
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border-default)',
        minWidth: '280px',
        maxWidth: '360px',
      }}
      role="status"
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-sm font-medium"
        style={{ background: style.bg, color: style.stroke }}
      >
        {style.icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {toast.title}
        </div>
        {toast.body && (
          <div className="mt-0.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {toast.body}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="shrink-0 text-text-tertiary transition-colors hover:text-text-primary"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export default function ToastHost() {
  const toasts = useAppStore((s) => s.toasts);
  if (!toasts.length) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
