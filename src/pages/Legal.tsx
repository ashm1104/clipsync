import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

// Placeholder legal pages. Real copy fills in once the operator entity,
// jurisdiction and contact email are decided.

const PLACEHOLDER = (
  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
    The full text of this policy is being finalised. If you have a question in the meantime,{' '}
    <Link to="/" className="underline underline-offset-2">
      reach out via the feedback form
    </Link>{' '}
    on the homepage.
  </p>
);

function Page({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-full">
      <Navbar />
      <main className="mx-auto max-w-[720px] px-4 py-10 md:px-[22px] md:py-12">
        <h1 className="text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {intro}
        </p>
        <div className="mt-6 flex flex-col gap-4">{children ?? PLACEHOLDER}</div>
      </main>
      <Footer />
    </div>
  );
}

export function Privacy() {
  return (
    <Page
      title="Privacy Policy"
      intro="What Clipta collects, why, and how long we keep it."
    >
      <section className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        <h2 className="mb-2 text-base font-medium" style={{ color: 'var(--text-primary)' }}>
          Data we collect
        </h2>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <strong>Clips</strong>: anything you paste — text, code, URLs, images, files. Stored
            in our database/storage and synced to your other devices.
          </li>
          <li>
            <strong>Account</strong>: email address (only if you sign in), display name (optional).
          </li>
          <li>
            <strong>Devices</strong>: browser/OS for your sync slots, last-seen timestamps.
          </li>
          <li>
            <strong>Usage</strong>: anonymous, privacy-friendly product analytics (no cookies, no
            cross-site tracking).
          </li>
        </ul>
      </section>

      <section className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        <h2 className="mb-2 text-base font-medium" style={{ color: 'var(--text-primary)' }}>
          Retention
        </h2>
        <ul className="list-inside list-disc space-y-1">
          <li>Anonymous rooms and their clips: 1 hour after creation.</li>
          <li>Free Personal Sync clips: 24 hours.</li>
          <li>Pro Personal Sync clips: 7 days.</li>
          <li>Account record: until you delete your account.</li>
        </ul>
      </section>

      <section className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        <h2 className="mb-2 text-base font-medium" style={{ color: 'var(--text-primary)' }}>
          Third parties
        </h2>
        <p>
          Clipta uses Supabase (database, auth, storage), Vercel (hosting), and Plausible Analytics
          (privacy-friendly analytics). Paid plans go through Dodo Payments. We don't sell or
          share your data with anyone else.
        </p>
      </section>

      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Full text in progress. For specific concerns, use the feedback form.
      </p>
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="Terms of Service" intro="By using Clipta, you agree to these terms.">
      <section className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        <h2 className="mb-2 text-base font-medium" style={{ color: 'var(--text-primary)' }}>
          Acceptable use
        </h2>
        <p>
          Don't use Clipta for content that's illegal, hateful, infringes copyright, or harms
          others. We may remove content and terminate accounts that break this rule.
        </p>
      </section>
      <section className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        <h2 className="mb-2 text-base font-medium" style={{ color: 'var(--text-primary)' }}>
          As-is service
        </h2>
        <p>
          Clipta is provided as-is, without warranty. We do our best to keep the service running
          and your data intact, but we can't guarantee zero downtime or zero data loss. Don't use
          Clipta as the sole storage for anything irreplaceable.
        </p>
      </section>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Full text in progress.
      </p>
    </Page>
  );
}

export function Refunds() {
  return (
    <Page title="Refund Policy" intro="What we do if Pro doesn't work out for you.">
      <section className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        <ul className="list-inside list-disc space-y-2">
          <li>
            <strong>Monthly plan</strong>: cancel anytime. No future charges. We don't refund the
            current month.
          </li>
          <li>
            <strong>Annual plan</strong>: full refund within 14 days of purchase, no questions.
            Outside 14 days, your subscription stays active until the end of the term.
          </li>
          <li>
            <strong>Service issues</strong>: if Clipta has a sustained outage that affected your
            use, contact us via the feedback form and we'll review case-by-case.
          </li>
        </ul>
      </section>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Full text in progress.
      </p>
    </Page>
  );
}
