import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';
import type { APIRoute } from 'astro';

const ORIGIN = 'https://worldlinemuse-lgtm.github.io';
const BASE = '/sarah-blachly-art';

function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const p = path.startsWith('/') ? path : '/' + path;
  // getImage()/ImageMetadata src values are already base-prefixed in the build
  const withBase = p.startsWith(BASE + '/') ? p : BASE + p;
  return ORIGIN + withBase;
}

export const GET: APIRoute = async () => {
  const artworks = await getCollection('artworks');
  const entries: string[] = [];

  for (const a of artworks) {
    const slug = a.id.replace(/\.md$/, '');
    // Point Google at a real, resolvable image: a large generated variant for
    // raster artwork, the original file for SVG.
    let imgPath = a.data.image?.src ?? '';
    try {
      if (a.data.image && a.data.image.format !== 'svg') {
        const large = await getImage({ src: a.data.image, width: 1600, format: 'webp' });
        imgPath = large.src;
      }
    } catch {
      /* keep the original source */
    }
    if (!imgPath) continue;
    entries.push(
      `  <url>\n` +
        `    <loc>${escapeXml(`${ORIGIN}${BASE}/work/${slug}/`)}</loc>\n` +
        `    <image:image>\n` +
        `      <image:loc>${escapeXml(absUrl(imgPath))}</image:loc>\n` +
        `      <image:title>${escapeXml(a.data.title)}</image:title>\n` +
        (a.data.description ? `      <image:caption>${escapeXml(a.data.description)}</image:caption>\n` : '') +
        `    </image:image>\n` +
        `  </url>`
    );
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    entries.join('\n') +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
