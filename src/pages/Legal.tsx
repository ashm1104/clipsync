import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

// Operator identity is intentionally not surfaced on the public legal
// pages. Brand "Pastio" + contact email + jurisdiction is sufficient
// disclosure under DPDP Act / GDPR / consumer law. Real operator
// identity is on file with payment provider, registrar, and bank for
// any legitimate legal process.

const CONTACT = 'support@pastio.app';
const JURISDICTION = 'Jharkhand, India';
const EFFECTIVE = 'April 26, 2026';

function Page({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-10 md:px-[22px] md:py-12">
        <h1 className="text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {intro}
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Effective: {EFFECTIVE}
        </p>
        <div className="mt-8 flex flex-col gap-6">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
      {children}
    </p>
  );
}

function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul
      className="list-disc space-y-1.5 pl-5 text-sm"
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <H2>{title}</H2>
      {children}
    </section>
  );
}

export function Privacy() {
  return (
    <Page
      title="Privacy Policy"
      intro={`What Pastio collects, why, and how long we keep it. Operated from ${JURISDICTION}.`}
    >
      <Section title="Plain-English summary">
        <P>
          Pastio is a clipboard sync utility. Anything you paste through Pastio is stored
          temporarily so we can deliver it to your other devices, then deleted automatically.
          We don't sell your data, run ad-tech, or share content with third parties beyond
          the infrastructure providers we strictly need to operate.
        </P>
      </Section>

      <Section title="Who this applies to">
        <P>
          This policy applies to anyone using Pastio at <strong>pastio.app</strong>. Pastio
          is operated from {JURISDICTION}. For privacy questions or data requests, email{' '}
          <strong>{CONTACT}</strong>.
        </P>
      </Section>

      <Section title="What we collect">
        <UL>
          <li>
            <strong>Clip content</strong> — the text, code, URLs, images, or files you paste
            through Pastio. Stored in our database (text/code/URL/metadata) or object storage
            (images/files).
          </li>
          <li>
            <strong>Account data</strong> — your email address (only if you sign in via Google
            or magic link) and an optional display name.
          </li>
          <li>
            <strong>Device data</strong> — an opaque session identifier from your auth token,
            a generic device label like "Chrome on macOS" derived from your User-Agent, and
            a last-seen timestamp. Used to power the device-slot feature.
          </li>
          <li>
            <strong>Usage analytics</strong> — anonymous, aggregate event data via Plausible
            Analytics. No cookies, no cross-site tracking, no fingerprinting. Counts pageviews,
            event names, country, and referrer source. Never includes clip content, user IDs,
            or email addresses.
          </li>
          <li>
            <strong>Feedback</strong> — if you submit feedback via the in-product form, we
            store the message text plus your email if you provided one.
          </li>
        </UL>
      </Section>

      <Section title="How long we keep it">
        <UL>
          <li>Anonymous rooms and their clips: deleted 1 hour after creation.</li>
          <li>Free Personal Sync clips: deleted 24 hours after creation.</li>
          <li>Pro Personal Sync clips: deleted 7 days after creation.</li>
          <li>
            Image and file uploads: deleted on the same schedule as the clip that referenced
            them.
          </li>
          <li>
            Account record (email, profile, devices): kept until you delete your account.
            Email <strong>{CONTACT}</strong> to request deletion.
          </li>
          <li>Analytics events (Plausible): aggregated, no personal identifier retained.</li>
          <li>
            Feedback submissions: kept until reviewed, then archived for product-history
            purposes.
          </li>
        </UL>
      </Section>

      <Section title="Third-party processors">
        <P>To run Pastio, your data passes through these providers:</P>
        <UL>
          <li>
            <strong>Supabase</strong> — database, authentication, file storage, real-time
            sync. Hosts the substance of your clips. Located in their Singapore region.
          </li>
          <li>
            <strong>Vercel</strong> — web hosting and edge functions. Sees request metadata
            (IP, User-Agent) but not clip content beyond what's in HTTP requests.
          </li>
          <li>
            <strong>Plausible Analytics</strong> — aggregate, cookieless analytics.
          </li>
          <li>
            <strong>Dodo Payments</strong> — handles Pro subscription billing as Merchant of
            Record. Sees customer billing info you enter (name, email, payment method,
            country). Pastio receives a customer ID and subscription status; we never see
            your payment-method details.
          </li>
          <li>
            <strong>Google / email magic-link providers</strong> — only if you choose those
            sign-in methods.
          </li>
        </UL>
        <P>We don't sell, rent, or trade your data with anyone outside this list.</P>
      </Section>

      <Section title="Cross-border data transfers">
        <P>
          Pastio's primary database is hosted in Singapore (Supabase ap-southeast-1).
          Vercel's edge runtime serves requests from the region nearest to you. By using
          Pastio from outside India, you consent to your data being processed in India,
          Singapore, and the United States (Vercel/Plausible). We rely on standard
          contractual clauses and the providers' own GDPR / DPDP-aligned terms for
          international transfers.
        </P>
      </Section>

      <Section title="Your rights">
        <P>
          Under India's Digital Personal Data Protection Act, 2023 (DPDP Act) and equivalent
          regimes (GDPR for EU residents, CCPA for California), you have the right to:
        </P>
        <UL>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Delete your data and account</li>
          <li>Export your data in a portable format</li>
          <li>Withdraw consent for processing at any time</li>
          <li>Lodge a complaint with the Data Protection Board of India or your local DPA</li>
        </UL>
        <P>
          To exercise any of these, email <strong>{CONTACT}</strong>. We respond within
          30 days.
        </P>
      </Section>

      <Section title="Marketing and automated decisions">
        <P>
          Pastio doesn't send marketing emails. The only emails you'll receive from us are
          transactional (sign-in magic links, billing receipts via Dodo, replies to your
          support requests). We don't run automated decision-making or profiling that has
          legal effect on you.
        </P>
      </Section>

      <Section title="Cookies and local storage">
        <P>
          Pastio uses the browser's localStorage and sessionStorage to remember your active
          session, room state, and UI preferences. We do <strong>not</strong> use third-party
          tracking cookies, advertising cookies, or social-media pixels. Plausible Analytics
          is configured cookieless.
        </P>
      </Section>

      <Section title="Children">
        <P>
          Pastio is not intended for users under 13. If we learn we've collected data from a
          child under 13, we delete it. If you're a parent or guardian and believe we have
          your child's data, contact <strong>{CONTACT}</strong>.
        </P>
      </Section>

      <Section title="Security">
        <P>
          We use HTTPS everywhere, RLS-protected database access, and JWT-based session
          authentication. Password-protected rooms use SHA-256 hashing. We can't fully
          guarantee security against every possible threat — no service can — but we follow
          standard practices. If you discover a vulnerability, please email <strong>{CONTACT}</strong>{' '}
          and we'll respond promptly.
        </P>
      </Section>

      <Section title="Changes to this policy">
        <P>
          If we materially change this policy, we'll update the effective date at the top
          and notify signed-in users in-product. Continued use after changes means acceptance.
        </P>
      </Section>

      <Section title="Contact">
        <P>
          Questions, requests, complaints: <strong>{CONTACT}</strong>.
        </P>
      </Section>
    </Page>
  );
}

export function Terms() {
  return (
    <Page
      title="Terms of Service"
      intro="The agreement between you and Pastio. By using Pastio, you agree to these Terms. If you don't agree, please don't use Pastio."
    >
      <Section title="What Pastio is">
        <P>
          Pastio is a real-time cross-device clipboard utility at <strong>pastio.app</strong>.
          You can use it anonymously (room-based sharing) or signed in (Personal Sync across
          your devices). A free tier is available; a paid Pro tier unlocks longer retention,
          more devices, and additional features.
        </P>
      </Section>

      <Section title="Eligibility">
        <UL>
          <li>You must be at least 13 years old to use Pastio.</li>
          <li>If you're between 13 and 18, you confirm a parent or guardian permits your use.</li>
          <li>You're responsible for following the laws of your country.</li>
        </UL>
      </Section>

      <Section title="Acceptable use">
        <P>You agree not to use Pastio to:</P>
        <UL>
          <li>Share content that's illegal where you live or where Pastio operates</li>
          <li>Distribute malware, phishing pages, or content that harms others</li>
          <li>
            Share copyrighted material you don't own the rights to (DMCA-style takedown
            requests can be sent to <strong>{CONTACT}</strong>)
          </li>
          <li>Harass, threaten, or impersonate others</li>
          <li>
            Attempt to overwhelm, reverse-engineer, or attack Pastio's infrastructure or
            other users
          </li>
          <li>Bypass usage limits, gate the service to others, or resell access</li>
          <li>Use automated scrapers or bots beyond reasonable personal use</li>
        </UL>
        <P>
          We may remove content and suspend or terminate accounts that violate these rules.
          Severe violations may be reported to law enforcement.
        </P>
      </Section>

      <Section title="Your account">
        <UL>
          <li>You're responsible for what's done under your account.</li>
          <li>Don't share your sign-in link or session with others.</li>
          <li>
            If you suspect unauthorised access, sign out from all devices via Settings and
            email <strong>{CONTACT}</strong>.
          </li>
          <li>
            We may suspend accounts that show signs of fraud or abuse, with notice where
            practical.
          </li>
        </UL>
      </Section>

      <Section title="Pro plan and billing">
        <UL>
          <li>
            Pro is billed monthly or annually via Dodo Payments (Merchant of Record). Prices
            shown on the upgrade screen are inclusive of any applicable taxes Dodo collects.
          </li>
          <li>
            Subscriptions auto-renew unless you cancel. You can cancel at any time from the
            billing portal linked in Settings → Billing.
          </li>
          <li>Refund terms are described in our <a className="underline underline-offset-2" href="/refunds">Refund Policy</a>.</li>
          <li>
            We may change Pro pricing for new customers with 14 days' notice. Existing
            subscribers keep their current price for the term they've already paid.
          </li>
        </UL>
      </Section>

      <Section title="Content ownership">
        <P>
          You own everything you paste through Pastio. We don't claim any ownership of your
          clips. We need a limited licence to store, sync, and display your content to you
          and (for shared rooms) to those you invite — that licence ends when the content
          is deleted.
        </P>
      </Section>

      <Section title="Pastio's intellectual property">
        <P>
          The Pastio brand, logo, code (where not separately open-sourced), and design are
          owned by Pastio. Don't clone the brand or imply affiliation. The product source
          code may be open-sourced separately under terms in the repository.
        </P>
      </Section>

      <Section title="Service availability">
        <P>
          Pastio is provided "as is" and "as available". We aim for high uptime and we run
          retention crons reliably, but we can't guarantee zero downtime, zero data loss, or
          uninterrupted service. Don't use Pastio as the sole storage for irreplaceable data.
        </P>
      </Section>

      <Section title="Disclaimers and liability">
        <P>
          To the fullest extent permitted by law, Pastio disclaims all warranties, express
          or implied, including merchantability and fitness for a particular purpose.
          Pastio's total liability for any claim arising out of or related to these Terms or
          your use of the service is limited to the amount you've paid Pastio in the 12 months
          before the claim, or ₹1,000 INR if you haven't paid anything.
        </P>
        <P>
          Nothing in these Terms limits liability that cannot be excluded under applicable
          consumer-protection law.
        </P>
      </Section>

      <Section title="Indemnification">
        <P>
          If a third party brings a claim against Pastio because of how you used the service
          (especially around content you posted), you agree to defend and hold us harmless,
          unless the claim arises from our own gross negligence.
        </P>
      </Section>

      <Section title="Termination">
        <UL>
          <li>You can stop using Pastio at any time. To delete your account, email <strong>{CONTACT}</strong>.</li>
          <li>
            We can suspend or terminate accounts that violate these Terms or pose a threat
            to the service or other users. We'll notify you where reasonable and refund any
            unused portion of a Pro subscription if termination wasn't due to your violation.
          </li>
        </UL>
      </Section>

      <Section title="Force majeure">
        <P>
          Pastio isn't liable for delays or failures caused by events beyond our reasonable
          control, including infrastructure-provider outages, internet failures, government
          action, natural disasters, or acts of war.
        </P>
      </Section>

      <Section title="Notices">
        <P>
          Legal notices to Pastio must be sent to <strong>{CONTACT}</strong> with "Legal
          Notice" in the subject. We send notices to you at the email you signed in with,
          or in-product if you haven't signed in.
        </P>
      </Section>

      <Section title="Severability and entire agreement">
        <P>
          If any part of these Terms is found unenforceable, the rest stays in effect. These
          Terms (together with the Privacy Policy and Refund Policy) are the entire agreement
          between you and Pastio about the service, and replace any earlier statements.
        </P>
      </Section>

      <Section title="Governing law and disputes">
        <P>
          These Terms are governed by the laws of India. Any dispute will be resolved in the
          courts of {JURISDICTION}, except where consumer-protection laws of your country
          require otherwise.
        </P>
      </Section>

      <Section title="Changes to these Terms">
        <P>
          If we materially change these Terms, we'll update the effective date at the top
          and notify signed-in users. Continued use after changes means acceptance. If you
          don't agree to the new terms, you can stop using Pastio at any time.
        </P>
      </Section>

      <Section title="Contact">
        <P>
          Questions, abuse reports, legal notices: <strong>{CONTACT}</strong>.
        </P>
      </Section>
    </Page>
  );
}

export function Refunds() {
  return (
    <Page title="Refund Policy" intro="What we do if Pro doesn't work out for you.">
      <Section title="Plain-English summary">
        <P>
          Cancel monthly anytime, no refund of the current month. Annual: full refund within
          14 days, no questions. After 14 days on annual, your subscription stays active
          until the end of the term but isn't refundable. Outages get reviewed case-by-case.
        </P>
      </Section>

      <Section title="Monthly subscriptions">
        <UL>
          <li>Cancel anytime from Settings → Billing. Future charges stop immediately.</li>
          <li>
            We don't refund the current month's charge — you keep Pro access until the end
            of the billing period.
          </li>
        </UL>
      </Section>

      <Section title="Annual subscriptions">
        <UL>
          <li>
            <strong>14-day full refund window</strong>: cancel within 14 days of the initial
            purchase or renewal and we'll refund 100% of the amount paid, no questions asked.
          </li>
          <li>
            <strong>After 14 days</strong>: cancellations take effect at the end of the
            current annual term. The remaining time isn't refundable, but you keep Pro access
            until then.
          </li>
        </UL>
      </Section>

      <Section title="Service-issue refunds">
        <P>
          If Pastio has a sustained outage that meaningfully affected your use of Pro
          features, email <strong>{CONTACT}</strong> with details. We review case-by-case and
          may issue partial or full credits depending on severity.
        </P>
      </Section>

      <Section title="Chargebacks">
        <P>
          If you have a billing concern, please email <strong>{CONTACT}</strong> first — we'll
          almost always sort it out faster than a chargeback. Chargebacks initiated without
          first contacting us may result in account suspension.
        </P>
      </Section>

      <Section title="How refunds happen">
        <P>
          Pro is billed via Dodo Payments. Refunds are issued back to your original payment
          method through Dodo and typically appear within 5–10 business days, depending on
          your bank. We don't issue refunds in cash, store credit, or alternate currencies.
        </P>
      </Section>

      <Section title="Contact">
        <P>
          Questions about a charge or refund: <strong>{CONTACT}</strong>.
        </P>
      </Section>
    </Page>
  );
}
