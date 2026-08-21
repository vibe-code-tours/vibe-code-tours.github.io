// Single source of truth for chapter-level borders on builder cards.
// Imported by: src/components/BuilderCard.astro (render).
//
// Levels are NOT self-declared. They come from the cohort progression DB
// (Discord `ch-N-done` roles -> chapter_progress.passed_at) and are exported
// to src/data/levels.json by the bot (channels/scripts/export-levels.mjs),
// keyed by lowercased GitHub login. Students cannot forge their level.
//
// src/data/levels.json shape: { "<github-login-lowercased>": <0..8> }
// Stored value = highest chapter PASSED (0..8). Displayed LEVEL = value + 1,
// so ch-0-done -> Level 1, ch-3-done -> Level 4, ch-8-done -> Level 9.

import levelData from "../data/levels.json";

// chapter-index (0..8) -> { label, color }. color drives the card border + glow.
// label is the player-facing LEVEL (chapter + 1): ch-0 done = Level 1 ... ch-8 done = Level 9.
export const LEVELS = {
  0: { label: "Level 1", color: "#94a3b8" }, // slate
  1: { label: "Level 2", color: "#34d399" }, // emerald
  2: { label: "Level 3", color: "#2dd4bf" }, // teal
  3: { label: "Level 4", color: "#22d3ee" }, // cyan
  4: { label: "Level 5", color: "#38bdf8" }, // sky
  5: { label: "Level 6", color: "#818cf8" }, // indigo
  6: { label: "Level 7", color: "#a78bfa" }, // violet
  7: { label: "Level 8", color: "#e879f9" }, // fuchsia
  8: { label: "Level 9", color: "#f59e0b" }, // amber / gold
};

export const MAX_LEVEL = 8;

// Highest passed chapter for a github handle, or null if none / not found.
export function levelOf(github) {
  if (!github) return null;
  const v = levelData[String(github).toLowerCase()];
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > MAX_LEVEL) return null;
  return n;
}

// Render metadata for a level int, or null.
export function levelMeta(level) {
  if (level == null) return null;
  return LEVELS[level] ?? null;
}
