// @ts-check
import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

/**
 * Canonical origin used for <link rel="canonical">, Open Graph URLs and the sitemap.
 * Override with SITE_URL at build time (see .env.example).
 */
const site = process.env.SITE_URL ?? 'https://zypher-agency.online';

/**
 * Cloudflare Turnstile is opt-in: the CSP only allows challenges.cloudflare.com
 * when PUBLIC_TURNSTILE_SITE_KEY is set at build time (env or .env file).
 */
const turnstile = Boolean(
  process.env.PUBLIC_TURNSTILE_SITE_KEY ??
  loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_').PUBLIC_TURNSTILE_SITE_KEY,
);

export default defineConfig({
  site,
  trailingSlash: 'never',
  build: { format: 'file' },
  output: 'static',
  adapter: node({ mode: 'standalone', staticHeaders: true }),
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  image: {
    layout: 'constrained',
  },
  security: {
    checkOrigin: true,
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "media-src 'self' https://cdn.dribbble.com",
        "font-src 'self'",
        turnstile ? "connect-src 'self' https://challenges.cloudflare.com" : "connect-src 'self'",
        // Same as default-src unless the Turnstile iframe is needed.
        turnstile ? 'frame-src https://challenges.cloudflare.com' : "frame-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        'upgrade-insecure-requests',
      ],
      ...(turnstile
        ? { scriptDirective: { resources: ["'self'", 'https://challenges.cloudflare.com'] } }
        : {}),
      // Inline style attributes (CSS custom properties on elements) need
      // 'unsafe-inline' for styles; scripts stay hash-locked.
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    },
  },
  env: {
    schema: {
      CONTACT_TO_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      TURNSTILE_SECRET_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },
  devToolbar: { enabled: false },
  markdown: { syntaxHighlight: false },
  vite: {
    plugins: [tailwindcss()],
    // Lets several dev servers run side by side without sharing a dep cache.
    cacheDir: process.env.VITE_CACHE_DIR ?? 'node_modules/.vite',
  },
});
