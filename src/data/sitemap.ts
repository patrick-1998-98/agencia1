/**
 * Sitemap configuration. Static pages are listed here; service and portfolio
 * detail pages are added automatically from their content collections.
 */
export type ChangeFreq = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface SitemapEntry {
  path: string;
  changefreq: ChangeFreq;
  priority: number;
}

export const staticPages: SitemapEntry[] = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/benefits', changefreq: 'monthly', priority: 0.9 },
  { path: '/services', changefreq: 'monthly', priority: 0.9 },
  { path: '/portfolios', changefreq: 'weekly', priority: 0.9 },
  { path: '/faq', changefreq: 'monthly', priority: 0.7 },
  { path: '/contact', changefreq: 'monthly', priority: 0.8 },
  { path: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { path: '/terms', changefreq: 'yearly', priority: 0.3 },
  { path: '/cookies', changefreq: 'yearly', priority: 0.3 },
];

export const detailDefaults = { changefreq: 'monthly', priority: 0.8 } as const;
