import { useEffect, useMemo, useState } from 'react';
import { useAppStore, type UpgradeReason } from '../../stores/appStore';
import { supabase } from '../../lib/supabase';
import { Events, trackEvent } from '../../lib/analytics';
import { detectPricingTier, getPricing, formatYearlyAsMonthly } from '../../lib/geo';

type Interval = 'monthly' | 'yearly';

const REASON_COPY: Record<UpgradeReason, { title: string; body: string }> = {
  image_limit: {
    title: '3 image limit reached',
    body: 'Free rooms hold 3 images. Upgrade for unlimited images per room.',
  },
  password_room: {
    title: 'Password protection is a Pro feature',
    body: 'Upgrade to lock rooms behind a password of your choice.',
  },
  file_upload: {
    title: 'File sharing is a Pro feature',
    body: 'Upgrade to send PDFs, ZIPs and more.',
  },
  custom_slug: {
    title: 'Custom room codes on Pro',
    body: 'Upgrade to pick memorable codes like /r/standup or /r/design.',
  },
  expiry_7d: {
    title: '7-day rooms on Pro',
    body: 'Upgrade to keep rooms alive for a week at a time.',
  },
  history_30d: {
    title: '7-day history on Pro',
    body: "Free keeps clips for 24 hours. Pro keeps every clip available for the week.",
  },
  third_device: {
    title: 'Pro syncs unlimited devices',
    body: 'Free accounts sync up to 2 devices. Upgrade for the whole setup.',
  },
  default: {
    title: 'Upgrade to Pro',
    body: 'Unlock every feature, on every device.',
  },
};

const FREE_BULLETS = [
  'Up to 10 MB images',
  '3 images per room',
  '2 synced devices',
  '24h history',
  '1h or 24h rooms',
];

const PRO_BULLETS = [
  'Up to 50 MB images',
  'Unlimited images per room',
  'Unlimited devices',
  '7-day history',
  '1h / 24h / 7-day rooms',
  'Password-protected rooms',
  'Custom room codes',
  'File uploads (PDF, ZIP, …)',
];

export default function UpgradeModal() {
  const open = useAppStore((s) => s.upgradeModalOpen);
  const close = useAppStore((s) => s.closeUpgrade);
  const reason = useAppStore((s) => s.upgradeReason);
  const userId = useAppStore((s) => s.userId);
  const openSignIn = useAppStore((s) => s.openSignIn);
  const pushToast = useAppStore((s) => s.pushToast);
  const [interval, setInterval] = useState<Interval>('monthly');
  const [busy, setBusy] = useState(false);
  const tier = useMemo(() => detectPricingTier(), []);
  const tierConfig = useMemo(() => getPricing(tier), [tier]);
  const yearlyMonthlyEquivalent = useMemo(() => formatYearlyAsMonthly(tier), [tier]);

  useEffect(() => {
    if (open) trackEvent(Events.upgradeModalOpened, { reason });
  }, [open, reason]);

  if (!open) return null;
  const copy = REASON_COPY[reason];
  const priceEntry = interval === 'monthly' ? tierConfig.monthly : tierConfig.yearly;
  const price = {
    label: priceEntry.label,
    sub:
      interval === 'monthly'
        ? 'per month'
        : `per year — ${yearlyMonthlyEquivalent} effective`,
  };

  const startCheckout = async () => {
    if (!userId) {
      close();
      openSignIn();
      return;
    }
    trackEvent(Events.upgradeClicked, { interval, reason, tier });
    setBusy(true);
    // Dodo wiring lands next. Until then surface a clear toast so the
    // button is honest about state.
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          interval,
          tier,
          productId: priceEntry.dodoProductId,
          userId,
        },
      });
      if (error || !data?.url) throw error ?? new Error('No checkout URL');
      window.location.href = data.url;
    } catch {
      pushToast({
        kind: 'info',
        title: 'Checkout coming soon',
        body: 'Payment wiring lands next — plan changes are preview-only for now.',
      });
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={close}
    >
      <div
        className="w-full max-w-[640px] rounded-modal p-6"
        style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              {copy.title}
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {copy.body}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-text-tertiary hover:text-text-primary"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div
          className="mt-4 inline-flex rounded-btn p-0.5"
          style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
        >
          {(['monthly', 'yearly'] as Interval[]).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInterval(i)}
              className="rounded-btn px-3 py-1 text-xs font-medium transition-colors"
              style={{
                background: interval === i ? 'var(--bg-card)' : 'transparent',
                color: interval === i ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: interval === i ? '0.5px solid var(--border-default)' : '0.5px solid transparent',
              }}
            >
              {i === 'monthly'
                ? 'Monthly'
                : `Yearly · save ${tierConfig.yearlyDiscountPct}%`}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div
            className="rounded-card p-4"
            style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)' }}
          >
            <div className="text-xs uppercase tracking-wider text-text-tertiary">Free</div>
            <div className="mt-1 text-base font-medium" style={{ color: 'var(--text-primary)' }}>
              $0
            </div>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {FREE_BULLETS.map((b) => (
                <li key={b}>· {b}</li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-card p-4"
            style={{
              background: 'var(--bg-card)',
              border: '2px solid #3B6D11',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider" style={{ color: '#3B6D11' }}>
                Pro
              </div>
              <div className="text-right">
                <div className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
                  {price.label}
                </div>
                <div className="text-[11px] text-text-tertiary">{price.sub}</div>
              </div>
            </div>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm" style={{ color: 'var(--text-primary)' }}>
              {PRO_BULLETS.map((b) => (
                <li key={b}>· {b}</li>
              ))}
            </ul>
          </div>
        </div>

        <button
          type="button"
          onClick={startCheckout}
          disabled={busy}
          className="mt-5 w-full rounded-btn px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-60"
          style={{ background: '#3B6D11' }}
          onMouseEnter={(e) => {
            if (!busy) e.currentTarget.style.background = '#27500A';
          }}
          onMouseLeave={(e) => {
            if (!busy) e.currentTarget.style.background = '#3B6D11';
          }}
        >
          {busy ? 'Starting checkout…' : userId ? `Upgrade — ${price.label} ${interval}` : 'Sign in to upgrade'}
        </button>
      </div>
    </div>
  );
}
