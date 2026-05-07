import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function pickMeta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  const m = html.match(re);
  if (m) return m[1];
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    'i'
  );
  return html.match(re2)?.[1] ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'missing url' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; PastioBot/1.0; +https://pastio.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    const html = await res.text();
    const title =
      pickMeta(html, 'og:title') ??
      pickMeta(html, 'twitter:title') ??
      html.match(/<title>([^<]+)<\/title>/i)?.[1] ??
      null;
    const description =
      pickMeta(html, 'og:description') ??
      pickMeta(html, 'twitter:description') ??
      pickMeta(html, 'description');
    const image =
      pickMeta(html, 'og:image') ?? pickMeta(html, 'twitter:image');

    return new Response(
      JSON.stringify({ title, description, image }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(JSON.stringify({ title: null, description: null, image: null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
