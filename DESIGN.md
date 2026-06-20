# Design notes — Vibe Tour

Typography-driven, mobile-first, neutral grayscale + one warm accent. No stock
photography. WCAG AA contrast. Lighthouse-friendly (no heavy client JS).

## Accent color: warm amber / gold

**Why:** the brand is "Vibe Tour" — a journey across the AI coding landscape.
Amber/gold evokes the caravan + golden-land motif and reads warm and welcoming
rather than corporate-cold or hype-blue. It also pairs cleanly with a neutral
gray UI.

Palette (Tailwind `accent.*`, an amber ramp):

| Token      | Hex       | Use                                           |
| ---------- | --------- | --------------------------------------------- |
| accent-50  | `#fffbeb` | hero card bg, notice banners                  |
| accent-100 | `#fef3c7` | Tier C pill bg, tag bg                        |
| accent-300 | `#fcd34d` | hero card border, OG accents                  |
| accent-500 | `#f59e0b` | card hover border                             |
| accent-600 | `#d97706` | primary button bg                             |
| accent-700 | `#b45309` | links, primary button hover, headings accents |
| accent-800 | `#92400e` | link/button hover text on light               |

Contrast: accent-700/800 on white and white on accent-600 both meet WCAG AA for
normal text. Body text is `gray-800` on white (AAA).

## Tier pills

Per the 06b spec:

- **Tier A — AI off**: gray (`bg-gray-200 / text-gray-700`)
- **Tier B — Foundation**: blue (`bg-blue-100 / text-blue-800`)
- **Tier C — AI default**: amber (`bg-accent-100 / text-accent-800`)

Rendered as small circular badges (`A` / `B` / `C`) with a `title="Tier X"`.

## Font stack

- **English / Latin:** system stack —
  `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
  Zero font download, instant render.
- **Burmese:** **Noto Sans Myanmar** (weights 400/600/700) via
  `@fontsource/noto-sans-myanmar`, self-hosted (no Google Fonts request).
  Applied on `html[lang="my"]` with slightly relaxed line-height for Burmese
  glyph stacking. Noto Sans Myanmar is also appended to the default `sans` stack
  as a fallback so stray Burmese glyphs render on English pages too.

## Spacing & layout scale

- Content widths: `max-w-3xl` (~prose pages), `max-w-4xl` (curriculum grid),
  `max-w-5xl` (header/footer/home cards).
- Horizontal padding: `px-5` mobile, `sm:px-6` ≥640px.
- Vertical section rhythm: `py-12` standard, `py-16/20` for the hero.
- Card padding `p-6`, radius `rounded-xl`, gap `gap-4`.
- Curriculum grid: 1-col mobile, `md:grid-cols-2` desktop; Ch0 is a full-width
  hero card above the grid.

## Component inventory

| Component                                  | Role                                                              |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `layouts/Base.astro`                       | HTML shell, SEO/OG/Twitter meta, canonical, header+footer         |
| `components/Header.astro`                  | brand, primary nav, EN/မြန်မာ language switcher                   |
| `components/Footer.astro`                  | legal links (terms/CoC/privacy/contact) + license line            |
| `components/ChapterCard.astro`             | one curriculum card (badge, tag, title, outcome, tier pills, CTA) |
| `components/LegalNotice.astro`             | "[MY] translation pending" banner on Burmese legal pages          |
| `components/HomeBody.astro`                | hero + 3-card grid + credibility row                              |
| `components/AboutBody.astro`               | beliefs + "what we're NOT"                                        |
| `components/TeamBody.astro`                | lead instructor + photo placeholder box                           |
| `components/CurriculumBody.astro`          | card grid + tier legend + get/commit table                        |
| `components/ApplyBody.astro`               | Cohort 1 closed state                                             |
| `components/SponsorsBody.astro`            | org + individual sponsorship                                      |
| `components/FaqBody.astro`                 | 13-item FAQ (`<dl>`)                                              |
| `components/ContactBody.astro`             | role-based emails + channels                                      |
| `components/{Terms,Coc,Privacy}Body.astro` | legal page bodies                                                 |

## Imagery

No stock photos. The instructor photo is a dashed placeholder box on `/team`.
`favicon.svg` and `og-default.svg` use an abstract "moving dots along a route"
motif (per the naming-decision logo direction). **Before launch, replace
`public/og-default.svg` with a 1200×630 PNG** — Telegram/Facebook prefer raster
OG images.
