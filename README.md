# Vibe Code Tours — public site

Bilingual (English + Burmese) static site for **Vibe Code Tours**, a Myanmar AI
coding tour. Tagline: _"A guided journey into AI-paired coding."_

Built with **Astro 5 + Tailwind CSS**, zero client JS by default, output is a
static site that deploys free to GitHub Pages.

## Quick start

```bash
npm install        # install dependencies
npm run dev        # local dev server at http://localhost:4321/vibe-code-tours-site
npm run build      # static build into dist/
npm run preview    # preview the built dist/ locally
```

## Project layout

```
src/
  i18n/
    en.json        # English copy (source of truth for UI strings)
    my.json        # Burmese copy — values prefixed "[MY] " need translation
    utils.ts       # locale detection + base-aware link helpers
  data/
    chapters.ts    # curriculum card data (Ch0-Ch8)
  layouts/Base.astro      # <head>, SEO/OG meta, header + footer wrapper
  components/             # Header, Footer, ChapterCard + one *Body per page
  pages/                  # routes (English at /, Burmese mirrored under /my)
public/            # favicon.svg, og-default.svg, robots.txt
scripts/gen-my.mjs # regenerates my.json skeleton from en.json
```

Each page is a thin route file that renders a shared `*Body.astro` component, so
the English and Burmese routes never duplicate markup — only the active locale
differs.

## Internationalization

- Astro i18n routing: English is the default at `/`, Burmese lives under `/my/`.
- UI copy comes from JSON locale files (`src/i18n/en.json`, `src/i18n/my.json`).
- A language switcher in the header toggles EN / မြန်မာ, preserving the sub-path.
- Burmese text uses the **Noto Sans Myanmar** webfont (via `@fontsource`),
  applied automatically on `html[lang="my"]`.

To add or improve Burmese translations, see **[TRANSLATION.md](./TRANSLATION.md)**.
Short version: edit `src/i18n/my.json`, replace each `[MY] <English>` value with
Burmese, and delete the `[MY] ` prefix.

## Deploying to GitHub Pages (when the org exists)

The repo is **local-only** for now (the `vibe-code-tours` GitHub org doesn't exist
yet). When ready:

1. Create the `vibe-code-tours` org + a repo named `vibe-code-tours-site`.
2. Push this repo to `main`.
3. In repo **Settings → Pages**, set **Source = GitHub Actions**.
4. The included workflow [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)
   builds and deploys on every push to `main`.

The site will be served at `https://vibe-code-tours.github.io/vibe-code-tours-site/`.

### Switching to a custom domain (vibecode.tours)

When the domain is purchased and pointed at GitHub Pages:

1. In `astro.config.mjs`, set `site: 'https://vibecode.tours'` and `base: '/'`.
2. Add a `public/CNAME` file containing `vibecode.tours`.
3. Rebuild. All internal links and the sitemap adapt automatically (they read
   `BASE_URL`).

## Licenses

- Curriculum content: CC-BY-SA 4.0
- Code: MIT
- Logo + visuals: CC-BY-SA 4.0.
