// Pure, DOM-free helpers for gallery sort/filter/derive. Unit-tested via node:test.
// Default filter state = every bar "*", empty query, sort "chapter".

const DEFAULT_SORT = "chapter";

export function sortCards(cells, key) {
  const arr = [...cells];
  if (key === "az") {
    arr.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );
  } else {
    // chapter desc; ties keep source order (stable)
    arr.sort(
      (a, b) =>
        (b.chapter ?? -1) - (a.chapter ?? -1) ||
        (a.order ?? 0) - (b.order ?? 0),
    );
  }
  return arr;
}

export function parseFilterQuery(search, defaultSort = DEFAULT_SORT) {
  const p = new URLSearchParams(search || "");
  const active = {};
  for (const [k, v] of p.entries()) {
    if (k === "q" || k === "sort") continue;
    active[k] = v;
  }
  return {
    active,
    query: p.get("q") ?? "",
    sort: p.get("sort") ?? defaultSort,
  };
}

export function serializeFilterQuery(
  { active = {}, query = "", sort = DEFAULT_SORT },
  defaultSort = DEFAULT_SORT,
) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(active)) {
    if (v && v !== "*") p.set(k, v);
  }
  if (query) p.set("q", query);
  if (sort && sort !== defaultSort) p.set("sort", sort);
  return p.toString();
}

export function stackDisplay(stack, max = 3) {
  const list = Array.isArray(stack) ? stack : [];
  return { shown: list.slice(0, max), extra: Math.max(0, list.length - max) };
}

export function shotCount(screenshots) {
  return Array.isArray(screenshots) ? screenshots.length : 0;
}
