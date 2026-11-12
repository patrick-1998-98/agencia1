// @ts-check
import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

/**
 * Canonical origin used for <link rel="canonical">, Open Graph URLs and the sitemap.
 * Override with SITE_URL at build time (see .env.example).
 */
const site = process.env.SITE_URL ?? 'https://zypher-agency.online';

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
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        'upgrade-insecure-requests',
      ],
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
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
