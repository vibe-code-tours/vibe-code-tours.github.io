# Team metadata + logos

Single source of truth for each team's identity — name, tagline, links, and logo.
Feeds the **project gallery**, the **WorkAdventure booth**, the **People's Choice vote**, and social cards.
One file per team so you can PR **your own** file without merge conflicts.

```
metadata/
  README.md            ← you are here
  gen-metadata.mjs     ← regenerates the yaml stubs from src/data/teams.json
  team-01.yaml … team-20.yaml
public/logos/
  team-01.svg  team-01-64x64.png  team-01-128x128.png  team-01-256x256.png
  …                    ← served at https://vibecode.tours/logos/<file>
```

## How a team contributes (PR)

1. Edit **your** `metadata/team-NN.yaml` — fill `tagline` and the `logo:` paths.
2. Drop your logo files in `public/logos/` following the naming below.
3. Open a PR touching only your two areas. We review + merge; the atlas/gallery re-harvest picks it up.

## Logo files — sizes & naming

**Format:** `SVG` preferred (scales to any size, one file). If raster, ship PNG at all three sizes.
**Shape:** square, centered, **transparent background** (PNG) or a solid brand color.
**Naming:** `team-NN-WxH.png` — zero-padded team number, explicit pixel size.

| Tier          | File                  | Pixels  | Used for                        |
| ------------- | --------------------- | ------- | ------------------------------- |
| vector (best) | `team-NN.svg`         | any     | everything — overrides the PNGs |
| **small**     | `team-NN-64x64.png`   | 64×64   | booth icon · vote card · nav    |
| **medium**    | `team-NN-128x128.png` | 128×128 | gallery card                    |
| **large**     | `team-NN-256x256.png` | 256×256 | social / OG / hero              |

Examples: `team-07-64x64.png`, `team-07-128x128.png`, `team-07.svg`.

Rules of thumb:

- Keep it a **mark/logo**, not a screenshot — 64×64 must stay legible.
- PNG ≤ ~50 KB each; SVG ≤ ~20 KB (inline paths, no embedded raster).
- No transparency in the mark itself if the booth wall is dark — add a light card behind if needed.

## Logo resolution order (harvest fallback)

```
team-NN.svg  →  team-NN-256/128/64 png  →  repo og:image  →  site favicon  →  generated color badge
```

So a team with **no** logo still renders a clean numbered badge; adding files upgrades it automatically.

The site resolves these **from disk**, not from the yaml — `src/lib/team-meta.mjs` looks for the
files that actually exist in `public/logos/` at build time, so a stub path pointing at a file you
never shipped is simply ignored. One exception: an `.svg` over 40 KB is skipped in favour of the
PNGs, because a traced-raster "svg" is too heavy for a 24 px card badge.

## metadata schema (`team-NN.yaml`)

See any `team-NN.yaml`. Fields: `team, team_no, name, title, tagline, desc, type, stack,
live_url, repo_url, video{youtube_id,youtube_url,drive_url}, logo{svg,small,medium,large}`.
Stubs are pre-filled from `src/data/teams.json`; teams fill `tagline` + `logo` paths.

## Regenerate stubs

```bash
node metadata/gen-metadata.mjs      # rewrites missing fields from teams.json, never clobbers your tagline/logo
```
