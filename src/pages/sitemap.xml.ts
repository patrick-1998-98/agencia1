import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { detailDefaults, staticPages, type SitemapEntry } from '@/data/sitemap';

/** Service and case-study pages, generated from their content collections. */
async function detailPages(): Promise<SitemapEntry[]> {
  const byOrder = (a: { data: { order: number } }, b: { data: { order: number } }) =>
    a.data.order - b.data.order;
  const services = (await getCollection('services')).sort(byOrder);
  const projects = (await getCollection('portfolio')).sort(byOrder);
  return [
    ...services.map((s) => ({ path: `/services/${s.id}`, ...detailDefaults })),
    ...projects.map((p) => ({ path: `/portfolios/${p.id}`, ...detailDefaults })),
  ];
}

export const GET: APIRoute = async ({ site }) => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const entries = [...staticPages, ...(await detailPages())];
  const urls = entries
    .map(
      ({ path, changefreq, priority }) => `  <url>
    <loc>${new URL(path, site).href.replace(/\/$/, path === '/' ? '/' : '')}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
