import React from 'react';
import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

const h = React.createElement;

// 512x512 PNG of the Pastio brand mark. Used as the canonical logo in
// Organization JSON-LD and as a fallback PNG favicon for crawlers that
// can't read SVG (some still don't). Cached aggressively at the edge —
// the brand mark only changes when we change brand colours.
export default function handler() {
  return new ImageResponse(
    h(
      'div',
      {
        style: {
          width: '512px',
          height: '512px',
          background: '#3B6D11',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"DM Sans", system-ui, sans-serif',
        },
      },
      h(
        'div',
        {
          style: {
            width: '320px',
            height: '380px',
            background: '#EAF3DE',
            borderRadius: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            paddingTop: '40px',
            gap: '24px',
          },
        },
        // Clipboard "clip" tab
        h('div', {
          style: {
            position: 'absolute',
            top: '-30px',
            width: '160px',
            height: '60px',
            background: '#3B6D11',
            borderRadius: '14px',
          },
        }),
        // Three lines representing content
        h('div', { style: { width: '220px', height: '18px', background: '#3B6D11', borderRadius: '9px' } }),
        h('div', { style: { width: '220px', height: '18px', background: '#3B6D11', borderRadius: '9px' } }),
        h('div', { style: { width: '160px', height: '18px', background: '#3B6D11', borderRadius: '9px' } })
      )
    ),
    {
      width: 512,
      height: 512,
      headers: {
        // 1 day in browsers + 1 year on the CDN. Image is effectively static.
        'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
      },
    }
  );
}
