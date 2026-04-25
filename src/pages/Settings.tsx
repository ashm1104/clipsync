import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';
import { useAnonAuth } from '../hooks/useAnonAuth';

type Tab = 'account' | 'preferences' | 'usage' | 'billing';

const TABS: { key: Tab; label: string }[] = [
  { key: 'account', label: 'Account' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'usage', label: 'Usage' },
  { key: 'billing', label: 'Billing' },
];

type Profile = {
  id: string;
  display_name: string | null;
  plan: 'free' | 'pro';
  default_expiry: '1h' | '24h' | '7d';
  auto_detect_code: boolean;
  preserve_rich_text: boolean;
  notify_on_join: boolean;
};

export default function Settings() {
  useAnonAuth();
  const navigate = useNavigate();
  const userId = useAppStore((s) => s.userId);
  const isAnon = useAppStore((s) => s.isAnonymous);
  const plan = useAppStore((s) => s.plan);
  const openUpgrade = useAppStore((s) => s.openUpgrade);
  const pushToast = useAppStore((s) => s.pushToast);
  const [tab, setTab] = useState<Tab>('account');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || isAnon) return;
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!cancelled) setEmail(u.user?.email ?? null);
      const { data } = await supabase
        .from('profiles')
        .select('id,display_name,plan,default_expiry,auto_detect_code,preserve_rich_text,notify_on_join')
        .eq('id', userId)
        .maybeSingle();
      if (!cancelled && data) setProfile(data as Profile);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, isAnon]);

  if (isAnon || !userId) {
    return (
      <div className="min-h-full">
        <Navbar />
        <main className="mx-auto max-w-[640px] px-[22px] py-16 text-center">
          <h1 className="text-xl text-text-primary">Sign in to view settings</h1>
          <p className="mt-2 text-sm text-text-secondary">Settings are available once you sign in.</p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-btn px-4 py-2 text-sm text-white"
            style={{ background: '#3B6D11' }}
          >
            Back home
          </Link>
        </main>
      </div>
    );
  }

  const updateProfile = async (patch: Partial<Profile>) => {
    if (!profile) return;
    const next = { ...profile, ...patch };
    setProfile(next);
    const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
    if (error) {
      pushToast({ kind: 'error', title: 'Could not save', body: error.message });
      setProfile(profile);
      return;
    }
    pushToast({ kind: 'success', title: 'Saved' });
  };

  return (
    <div className="min-h-full">
      <Navbar />
      <main
        className="mx-auto grid"
        style={{
          maxWidth: '960px',
          gridTemplateColumns: '200px 1fr',
          gap: '18px',
          padding: '20px 22px',
        }}
      >
        <aside>
          <nav className="flex flex-col gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="rounded-btn px-3 py-2 text-left text-sm transition-colors"
                style={{
                  background: tab === t.key ? 'var(--bg-card)' : 'transparent',
                  color: 'var(--text-primary)',
                  border: tab === t.key ? '0.5px solid var(--border-default)' : '0.5px solid transparent',
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </aside>
        <section
          className="rounded-card p-6"
          style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-default)' }}
        >
          {tab === 'account' && (
            <AccountTab
              email={email}
              displayName={profile?.display_name ?? null}
              onSaveDisplayName={(v) => updateProfile({ display_name: v })}
              onSignOut={async () => {
                await supabase.auth.signOut();
                navigate('/');
              }}
            />
          )}
          {tab === 'preferences' && profile && (
            <PreferencesTab
              profile={profile}
              isPro={plan === 'pro'}
              onChange={updateProfile}
              onProGate={() => openUpgrade('expiry_7d')}
            />
          )}
          {tab === 'usage' && <UsageTab userId={userId} />}
          {tab === 'billing' && (
            <BillingTab plan={plan} onUpgrade={() => openUpgrade('default')} />
          )}
        </section>
      </main>
    </div>
  );
}

function AccountTab({
  email,
  displayName,
  onSaveDisplayName,
  onSignOut,
}: {
  email: string | null;
  displayName: string | null;
  onSaveDisplayName: (v: string) => void;
  onSignOut: () => void;
}) {
  const [name, setName] = useState(displayName ?? '');
  useEffect(() => setName(displayName ?? ''), [displayName]);

  return (
    <div>
      <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
        Account
      </h2>
      <div className="mt-4 flex flex-col gap-4">
        <Field label="Email">
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {email ?? '—'}
          </div>
        </Field>
        <Field label="Display name">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              className="flex-1 rounded-btn px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--bg-surface)',
                border: '0.5px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              onClick={() => onSaveDisplayName(name.trim())}
              className="rounded-btn px-3 py-2 text-sm font-medium text-white"
              style={{ background: '#3B6D11' }}
            >
              Save
            </button>
          </div>
        </Field>
      </div>

      <h3 className="mt-8 text-sm uppercase tracking-wider text-text-tertiary">Danger zone</h3>
      <div
        className="mt-2 rounded-card p-4"
        style={{ border: '0.5px solid var(--border-default)' }}
      >
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-btn px-3 py-2 text-sm transition-colors"
          style={{
            background: 'var(--bg-surface)',
            border: '0.5px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          Sign out
        </button>
        <p className="mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Account deletion can be requested from support — coming soon.
        </p>
      </div>
    </div>
  );
}

function PreferencesTab({
  profile,
  isPro,
  onChange,
  onProGate,
}: {
  profile: Profile;
  isPro: boolean;
  onChange: (patch: Partial<Profile>) => void;
  onProGate: () => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
        Preferences
      </h2>
      <div className="mt-4 flex flex-col gap-4">
        <Field label="Default room expiry">
          <div className="grid grid-cols-3 gap-2">
            {(['1h', '24h', '7d'] as const).map((v) => {
              const locked = v === '7d' && !isPro;
              const selected = !locked && profile.default_expiry === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => (locked ? onProGate() : onChange({ default_expiry: v }))}
                  className="rounded-btn px-3 py-2 text-sm"
                  style={{
                    background: selected ? '#EAF3DE' : 'var(--bg-surface)',
                    border: `0.5px solid ${selected ? '#3B6D11' : 'var(--border-subtle)'}`,
                    color: locked ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    opacity: locked ? 0.55 : 1,
                  }}
                >
                  {v}
                  {locked && <span className="ml-1 text-[9px] uppercase">Pro</span>}
                </button>
              );
            })}
          </div>
        </Field>

        <Toggle
          label="Auto-detect code on paste"
          value={profile.auto_detect_code}
          onChange={(v) => onChange({ auto_detect_code: v })}
        />
        <Toggle
          label="Preserve rich text formatting"
          value={profile.preserve_rich_text}
          onChange={(v) => onChange({ preserve_rich_text: v })}
        />
        <Toggle
          label="Notify when someone joins my room"
          value={profile.notify_on_join}
          onChange={(v) => onChange({ notify_on_join: v })}
        />
      </div>
    </div>
  );
}

function UsageTab({ userId }: { userId: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [bytes, setBytes] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { count: c } = await supabase
        .from('personal_clips')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (!cancelled) setCount(c ?? 0);
      const { data } = await supabase
        .from('personal_clips')
        .select('size_bytes')
        .eq('user_id', userId);
      if (!cancelled) {
        const total = (data ?? []).reduce((s, r) => s + (r.size_bytes ?? 0), 0);
        setBytes(total);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div>
      <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
        Usage
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Stat label="Personal clips" value={count == null ? '—' : count.toString()} />
        <Stat
          label="Storage used"
          value={bytes == null ? '—' : `${(bytes / 1024 / 1024).toFixed(2)} MB`}
        />
      </div>
      <p className="mt-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Free plan keeps the last 24 hours of personal sync history.
      </p>
    </div>
  );
}

function BillingTab({ plan, onUpgrade }: { plan: 'free' | 'pro'; onUpgrade: () => void }) {
  return (
    <div>
      <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
        Billing
      </h2>
      <div
        className="mt-4 rounded-card p-4"
        style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-text-tertiary">Current plan</div>
            <div className="mt-1 text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              {plan === 'pro' ? 'Pro' : 'Free'}
            </div>
          </div>
          {plan === 'free' ? (
            <button
              type="button"
              onClick={onUpgrade}
              className="rounded-btn px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#3B6D11' }}
            >
              Upgrade
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="rounded-btn px-4 py-2 text-sm"
              style={{
                background: 'var(--bg-surface)',
                border: '0.5px solid var(--border-subtle)',
                color: 'var(--text-tertiary)',
                opacity: 0.6,
              }}
            >
              Manage (coming soon)
            </button>
          )}
        </div>
      </div>
      {plan === 'free' && (
        <p className="mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Pro unlocks 7-day rooms, password protection, custom slugs, unlimited devices, file uploads
          and 30-day history.
        </p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs uppercase tracking-wider text-text-tertiary">{label}</div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="rounded-pill px-2 py-0.5 text-xs transition-colors"
        style={{
          background: value ? '#3B6D11' : 'var(--bg-surface)',
          color: value ? 'white' : 'var(--text-secondary)',
          border: '0.5px solid var(--border-subtle)',
        }}
      >
        {value ? 'on' : 'off'}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-card p-4"
      style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)' }}
    >
      <div className="text-xs uppercase tracking-wider text-text-tertiary">{label}</div>
      <div className="mt-1 text-2xl" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}
