// Production server: wraps the Astro Node handler to add security headers
// and canonical-URL redirects to every response (static pages included).
//
//   npm run build && npm start      (PORT / HOST env vars are honoured)

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

process.env.ASTRO_NODE_AUTOSTART = 'disabled';
const { handler } = await import('./dist/server/entry.mjs');

/**
 * Prerendered pages are written as <route>.html ("file" build format). When a
 * route also has child pages (services.html + services/brand.html) the static
 * handler would look for services/index.html, so clean URLs are mapped to their
 * .html file here. The public URL never changes.
 */
const CLIENT_DIR = path.join(import.meta.dirname, 'dist', 'client');
const htmlRoutes = new Set();
(function collect(dir, prefix) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) collect(path.join(dir, entry.name), `${prefix}/${entry.name}`);
    else if (entry.name.endsWith('.html')) htmlRoutes.add(`${prefix}/${entry.name.slice(0, -5)}`);
  }
})(CLIENT_DIR, '');

/** Per-page headers (the CSP with script hashes) emitted by Astro at build time. */
const pageHeaders = new Map(
  JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'dist', '_headers.json'), 'utf8')).map(
    (entry) => [entry.pathname.replace(/\/$/, '') || '/', entry.headers],
  ),
);

const PORT = Number(process.env.PORT ?? 4321);
const HOST = process.env.HOST ?? '0.0.0.0';

const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

/** Used when a response has no CSP of its own (API responses, assets). */
const FALLBACK_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";

/** Permanent redirects for legacy / non-canonical URLs. */
const REDIRECTS = new Map([['/index', '/']]);

function canonicalPath(pathname) {
  if (REDIRECTS.has(pathname)) return REDIRECTS.get(pathname);
  if (pathname.endsWith('.html')) return pathname.replace(/(\/index)?\.html$/, '') || '/';
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.replace(/\/+$/, '') || '/';
  return null;
}

const server = http.createServer((req, res) => {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(key, value);

  // Fill in a CSP for responses that did not set one (Astro sets per-page CSPs).
  const writeHead = res.writeHead.bind(res);
  res.writeHead = (...args) => {
    if (!res.hasHeader('Content-Security-Policy')) {
      const headersArg = args.find((a) => a && typeof a === 'object');
      const hasCsp =
        headersArg &&
        Object.keys(headersArg).some((k) => k.toLowerCase() === 'content-security-policy');
      const status = typeof args[0] === 'number' ? args[0] : res.statusCode;
      const notFoundCsp = pageHeaders
        .get('/404')
        ?.find((h) => h.key.toLowerCase() === 'content-security-policy')?.value;
      if (!hasCsp) {
        res.setHeader(
          'Content-Security-Policy',
          status === 404 && notFoundCsp ? notFoundCsp : FALLBACK_CSP,
        );
      }
    }
    return writeHead(...args);
  };

  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith('/_astro/') && (req.method === 'GET' || req.method === 'HEAD')) {
    const target = canonicalPath(url.pathname);
    if (target && target !== url.pathname) {
      res.writeHead(301, { Location: target + url.search });
      res.end();
      return;
    }
  }

  // Long-lived caching for self-hosted fonts (fingerprinted /_astro assets are handled by Astro).
  if (url.pathname.startsWith('/fonts/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }

  const route = url.pathname === '/' ? '/' : url.pathname;
  for (const { key, value } of pageHeaders.get(route) ?? []) res.setHeader(key, value);

  if (htmlRoutes.has(url.pathname) && url.pathname !== '/index') {
    req.url = `${url.pathname}.html${url.search}`;
  }

  handler(req, res);
});

server.listen(PORT, HOST, () => {
  console.warn(`Zypher listening on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});
