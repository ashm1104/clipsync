# Clipta

> The clipboard your devices were always missing.

Cross-device clipboard sync. Paste anything — text, code, URLs, images, files — on one device and it shows up on the others. No app to install, just open the URL and paste.

🌐 **[clipta.app](https://clipta.app)**

## What it does

**Anonymous mode** — Open Clipta, paste anything, get a 6-character room code or QR. Open the same URL on your other device, enter the code, and the clipboard syncs in real time. The room expires in one hour. Zero sign-up.

**Personal Sync (signed in)** — Sign in with Google or magic link. Now your clipboard follows you across all signed-in devices automatically. No codes. Free plan keeps 24 hours of history; Pro keeps 7 days and unlocks unlimited devices, password rooms, file uploads, and longer-lived rooms.

## Features

- Real-time sync across devices via Supabase Realtime
- Smart paste detection: text, rich text, code (with Shiki syntax highlighting), URLs (with OG previews), images, files
- Anonymous and authenticated modes
- Room-based sharing with optional password protection (Pro)
- Personal Sync mode with sticky device-slot management
- iOS Safari clipboard fallback
- Mobile-friendly responsive design with top tab navigation
- Custom room codes (Pro)
- Auto-expiring rooms with cleanup cron
- Privacy-friendly — no analytics cookies, minimal tracking

## Tech stack

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS, Zustand
- **Realtime + DB + Auth + Storage**: Supabase
- **Code highlighting**: Shiki
- **Rich text**: TipTap
- **QR codes**: qrcode.react
- **Hosting**: Vercel
- **Payments**: Dodo Payments (Merchant of Record)

## Pricing

| | Free | Pro |
|---|---|---|
| Anonymous rooms | 1h TTL | 1h / 24h / 7-day |
| Personal Sync history | 24 hours | 7 days |
| Synced devices | 2 | Unlimited |
| Images per room | 3 | Unlimited |
| Image cap | 10 MB | 50 MB |
| File uploads | — | ✓ (PDF, ZIP, CSV, …) |
| Password-protected rooms | — | ✓ |
| Custom room codes | — | ✓ |

**Pro pricing:** $5/mo · $48/yr (Western markets) · ₹99/mo · ₹799/yr (India + South Asia)

## Local development

```bash
npm install
cp .env.example .env  # add your Supabase keys
npm run dev
```

Required env vars:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Architecture notes

- Anon-room cleanup runs hourly via pg_cron + a plpgsql function (DB-only, no service-role keys stored).
- Storage cleanup queue is drained by a secret-gated Edge Function on a separate external schedule (every 6h).
- Personal_clips retention matches plan (24h free, 7d Pro), enforced by a separate hourly cron.
- Device gate is server-enforced via JWT `session_id` claim and an `is_active_personal_device()` SQL function — RLS reads it for the personal_clips SELECT policy, so the gate works for both PostgREST and Realtime.
- Sticky-slot device model: free users get 2 slots, claim/pause is explicit (no flapping by recency).

## License

TBD — likely MIT once 1.0 lands.

---

Built for the moment between phone and laptop.
