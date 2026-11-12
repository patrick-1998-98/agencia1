import type { APIRoute } from 'astro';

/*
 * /admin is a public demo marked `noindex` in its <head>; it is intentionally
 * NOT disallowed here, otherwise crawlers could never read that noindex.
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('/sitemap.xml', site).href;
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /api/', '', `Sitemap: ${sitemap}`, ''].join(
    '\n',
  );
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
