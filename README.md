# Sarah Blachly Art

Art portfolio website for Sarah Blachly — self-taught artist. Dark forest at night / Milky Way aesthetic, pure CSS atmosphere.

## Stack

- **Astro** — static site, content collections, image optimization, sitemap
- **Sveltia CMS** — git-based CMS at `/admin/` so Sarah can add artworks, series, and update pages without touching code
- **Web3Forms** — contact form backend (key needed: replace `YOUR-WEB3FORMS-KEY` in `src/pages/contact.astro`)
- **PhotoSwipe** — lightbox (to be wired on gallery pages)
- **Umami** — privacy-friendly analytics (to be added)
- **GitHub Pages** — hosting

## Development

```bash
npm install
npm run dev
```

## CMS setup

1. Deploy the Sveltia CMS OAuth proxy (`sveltia-cms-auth`) and set `base_url` in `public/admin/config.yml`.
2. Sarah logs in at `/admin/` with GitHub.

## Content

Artworks live in `src/content/artworks/` (one Markdown file per piece, validated against the schema in `src/content/config.ts`). Sarah's real artwork, bio, and photos get added when she provides them.
