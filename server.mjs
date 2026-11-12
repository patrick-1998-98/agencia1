// Production server: wraps the Astro Node handler to add security headers
// and canonical-URL redirects to every response (static pages included).
//
//   npm run build && npm start      (PORT / HOST env vars are honoured)

import http from 'node:http';

process.env.ASTRO_NODE_AUTOSTART = 'disabled';
const { handler } = await import('./dist/server/entry.mjs');

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
      if (!hasCsp) res.setHeader('Content-Security-Policy', FALLBACK_CSP);
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

  handler(req, res);
});

server.listen(PORT, HOST, () => {
  console.warn(`Zypher listening on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});
