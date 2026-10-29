/** Serve ads.txt only after a real AdSense publisher identifier is configured. */
export function GET() {
  const id = process.env.ADSENSE_PUBLISHER_ID?.trim() || '';
  if (!/^pub-\d{16}$/.test(id)) {
    return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  return new Response(`google.com, ${id}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
}
