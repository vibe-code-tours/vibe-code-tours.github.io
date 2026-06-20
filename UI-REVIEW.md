# UI/UX Review — Vibe Code Tours

Audit method: chrome-devtools MCP against the **live** site (https://vibecode.tours

- /my/) at Desktop 1440px and Mobile 390px, cross-referenced with source in
  `src/`. Screenshots captured to `.ui-audit/` (and inline during audit).

Severity: **HIGH** = ship-blocking quality/a11y, **MED** = clear improvement,
**LOW** = nice-to-have / deferred.

---

## 1. Visual hierarchy

| Sev | Finding                                                                                                                                                                                    | Location                      | Fix                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | --------------------------------------------------------------- |
| LOW | Home hero is strong — eye lands on H1 → amber stat → primary CTA. Good.                                                                                                                    | `HomeBody.astro:17-26`        | none                                                            |
| MED | Curriculum intro "See sample curriculum" / "Download outline (PDF)" links sit as small inline accent text with no button affordance; easy to miss.                                         | `CurriculumBody.astro:16-19`  | Give them a subtle pill/underline treatment (deferred — minor). |
| LOW | Desktop prose pages (apply/about/team) are centered `max-w-3xl` but read left-biased on 1440px because all content is left-aligned in a centered column. Acceptable for a docs-style site. | `global.css .container-prose` | none                                                            |

## 2. Typography

| Sev  | Finding                                                                                                                      | Location                     | Fix  |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---- |
| LOW  | Type scale is clean (H1 4xl/5xl, body lg, cards sm). Rhythm consistent.                                                      | global                       | none |
| GOOD | Burmese /my/ renders Noto Sans Myanmar correctly; stacked diacritics clean; `leading-relaxed` gives comfortable line-height. | `global.css html[lang='my']` | none |
| LOW  | Body copy uses `text-gray-600/700` at `max-w-prose` (70ch) — good measure.                                                   | global                       | none |

## 3. Spacing

| Sev | Finding                                                                              | Location            | Fix                            |
| --- | ------------------------------------------------------------------------------------ | ------------------- | ------------------------------ |
| LOW | Vertical rhythm (`py-12`, `mt-8/10`) is consistent and breathable.                   | body components     | none                           |
| LOW | Home card grid `gap-4` is slightly tight on desktop vs the generous hero whitespace. | `HomeBody.astro:30` | bump to `gap-5` md+ (applied). |

## 4. Color

| Sev  | Finding                                                                                                        | Location | Fix  |
| ---- | -------------------------------------------------------------------------------------------------------------- | -------- | ---- |
| GOOD | Amber used with intent (hero stat, CTA, tier-C, "start here"). `accent-600/700/800` keep AA contrast on white. | tokens   | none |
| LOW  | Palette leans monochrome (gray + amber + one blue for tier-B). Intentional/clean for a learning site.          | tokens   | none |

## 5. Mobile (390px)

| Sev  | Finding                                                                                                                                                      | Location             | Fix                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- | ----------------------------------------------------------------- |
| HIGH | **Nav link tap targets ~31px tall** (measured) — below the 44px minimum; text-only with no vertical padding. Worse in Burmese (2-row wrap, tight `gap-y-1`). | `Header.astro:24-35` | Add `py-1.5 -mx-1 px-1` style padding + larger row gap (applied). |
| HIGH | **Language toggle 30px×41px** (measured) — below 44px tap target.                                                                                            | `Header.astro:38-44` | Bump padding to reach ~44px min height (applied).                 |
| GOOD | No horizontal scroll at 390px (scrollWidth == clientWidth). CTAs stack, card grids collapse to 1 col.                                                        | —                    | none                                                              |

## 6. Polish

| Sev  | Finding                                                                                                                                                                                                                                                           | Location                                           | Fix                                                                                                             |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| HIGH | **No focus-visible rings anywhere** — site relies on default browser outline, which is inconsistent on custom buttons/cards (WCAG 2.4.7, keyboard a11y).                                                                                                          | `global.css`                                       | Add global `:focus-visible` amber ring on links/buttons/cards (applied).                                        |
| HIGH | **Chapter cards advertise false clickability.** `card-link` adds a hover-lift + shadow and each card shows an amber "Read more →" that looks like a link, but the `<article>` has no `href` and there is no chapter detail page. Misleads keyboard + mouse users. | `ChapterCard.astro:13,27`; `global.css .card-link` | Remove the hover-lift/clickable affordance and de-emphasize "Read more" so cards read as static info (applied). |
| MED  | Card hover on home info cards: `.card` has `transition` but no hover state, so transition does nothing.                                                                                                                                                           | `HomeBody.astro:32` / `global.css .card`           | Add a subtle border-color hover (applied).                                                                      |
| LOW  | Footer is tidy; legal sub-links use `accent-700`. Good.                                                                                                                                                                                                           | `Footer.astro`                                     | none                                                                                                            |
| LOW  | Team instructor "Photo coming soon" dashed placeholder is a clean empty state.                                                                                                                                                                                    | `TeamBody.astro:13-19`                             | none                                                                                                            |

---

## Applied (this pass)

- **A11y focus rings**: global `:focus-visible` amber ring for links, buttons,
  `.card`, and interactive header/footer elements (`global.css`).
- **Mobile tap targets**: header nav links + language toggle padded to ≥44px
  effective height; nav row gap loosened for the Burmese 2-row wrap
  (`Header.astro`).
- **Chapter card honesty**: removed false-link hover-lift; "Read more →" no
  longer styled as an interactive accent link — cards now read as static
  reference cards (`ChapterCard.astro`, `global.css`).
- **Card hover**: `.card` gains a subtle `hover:border-accent-300` so the
  existing `transition` is meaningful on home info cards (`global.css`).
- **Home grid breathing room**: card gap `gap-4` → `gap-5` at md+ (`HomeBody.astro`).

## Deferred (future pass — not design-safe or out of scope)

- **Content bug (not design)**: Team "Want to help?" renders "See the for how
  to contribute." — the `.replace(/sponsors page/i,'')` in `TeamBody.astro:42`
  strips the noun and leaves a double space. Needs an i18n string fix, not a
  design change.
- **Curriculum "Download outline (PDF)"** anchors to `#curriculum-grid` rather
  than an actual PDF — link target/content decision.
- Optional: give curriculum intro CTAs (`ctaSample`/`ctaDownload`) a button
  treatment for stronger affordance.
- Optional: if chapter detail pages are ever added, restore real links on the
  cards (revert the affordance change) and point them at the detail routes.
- Optional: consider a single restrained secondary tint to break the
  gray+amber monochrome on long pages.
