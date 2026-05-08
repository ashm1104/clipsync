import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

// Vercel Edge Function. Hit https://pastio.app/api/og to render the
// 1200x630 social-share card. Referenced from index.html as the
// og:image / twitter:image so previews on Slack / iMessage / X / LinkedIn
// always reflect current brand without us maintaining a static asset.
export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f0ede8',
          backgroundImage:
            'radial-gradient(circle at 0% 0%, #EAF3DE 0%, transparent 40%), radial-gradient(circle at 100% 100%, #FAEEDA 0%, transparent 50%)',
          padding: '64px 72px',
          fontFamily: '"DM Sans", system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#3B6D11',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              color: 'white',
            }}
          >
            P
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 500,
              color: '#1a1a18',
              letterSpacing: '0.02em',
            }}
          >
            pastio
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: '76px',
              fontWeight: 500,
              color: '#1a1a18',
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
              maxWidth: '900px',
            }}
          >
            The clipboard your devices were always missing.
          </div>
          <div
            style={{
              fontSize: '28px',
              color: '#5a5754',
              lineHeight: 1.3,
              maxWidth: '880px',
            }}
          >
            Paste anything on one device, get it on the others. No install, no app — just open the URL and paste.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            fontSize: '20px',
            color: '#5a5754',
          }}
        >
          <div style={{ display: 'flex', gap: '14px' }}>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '999px',
                background: '#EAF3DE',
                color: '#27500A',
              }}
            >
              text · code · images · files
            </span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '20px', color: '#9a9690' }}>
            pastio.app
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
