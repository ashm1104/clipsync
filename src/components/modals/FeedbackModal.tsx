import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../stores/appStore';

export default function FeedbackModal() {
  const open = useAppStore((s) => s.feedbackModalOpen);
  const close = useAppStore((s) => s.closeFeedback);
  const userId = useAppStore((s) => s.userId);
  const isAnon = useAppStore((s) => s.isAnonymous);
  const pushToast = useAppStore((s) => s.pushToast);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('feedback').insert({
      user_id: !isAnon && userId ? userId : null,
      email: email.trim() || null,
      message: message.trim(),
      user_agent: navigator.userAgent,
      url: window.location.href,
    });
    setBusy(false);
    if (error) {
      pushToast({ kind: 'error', title: 'Could not send', body: error.message });
      return;
    }
    pushToast({ kind: 'success', title: 'Thanks for the feedback', body: 'We read every message.' });
    setMessage('');
    setEmail('');
    close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={close}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-[460px] rounded-modal p-6"
        style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            Send feedback
          </h2>
          <button
            type="button"
            onClick={close}
            className="text-text-tertiary hover:text-text-primary"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Bugs, ideas, or just saying hi — we read everything.
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What's on your mind?"
          rows={5}
          maxLength={5000}
          required
          className="mt-4 w-full rounded-btn px-3 py-2 text-sm outline-none placeholder:text-text-tertiary"
          style={{
            background: 'var(--bg-surface)',
            border: '0.5px solid var(--border-default)',
            color: 'var(--text-primary)',
            fontFamily: 'DM Sans, system-ui, sans-serif',
            resize: 'vertical',
          }}
        />

        {isAnon && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email (optional, only if you want a reply)"
            className="mt-2 w-full rounded-btn px-3 py-2 text-sm outline-none placeholder:text-text-tertiary"
            style={{
              background: 'var(--bg-surface)',
              border: '0.5px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          />
        )}

        <button
          type="submit"
          disabled={busy || !message.trim()}
          className="mt-4 w-full rounded-btn px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: '#3B6D11' }}
        >
          {busy ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
