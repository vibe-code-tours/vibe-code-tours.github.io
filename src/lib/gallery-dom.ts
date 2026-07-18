// src/lib/gallery-dom.ts — shared client-side gallery behaviors.
export function ogFallback(repoUrl: string): string {
  const m = repoUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  return m ? `https://opengraph.githubassets.com/1/${m[1]}/${m[2]}` : "";
}

export function lockScroll(on: boolean) {
  document.body.style.overflow = on ? "hidden" : "";
}

// Gallery images (`.gallery-img`) that fail to load are hidden in favor of
// their sibling `.gallery-fallback` placeholder, so teams/projects without a
// working thumbnail still look presentable. Image `error` events do not
// bubble, so this listens in the capture phase on a shared ancestor.
export function wireImageFallback(rootSelector: string) {
  const root = document.querySelector(rootSelector);
  if (!root) return;
  root.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (
        !(img instanceof HTMLImageElement) ||
        !img.classList.contains("gallery-img")
      )
        return;
      img.classList.add("hidden");
      const fallback =
        img.parentElement?.querySelector<HTMLElement>(".gallery-fallback");
      fallback?.classList.remove("hidden");
      fallback?.classList.add("flex");
    },
    true,
  );
}

export function fadeInOnScroll(selector: string) {
  const cells = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    cells.forEach((c) => c.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries)
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  cells.forEach((c) => io.observe(c));
}

// Filter grid cells by type/status/stack + free text. Cells carry data-* attrs.
export function wireFilter(opts: {
  gridId: string;
  countEl: HTMLElement | null;
  emptyEl: HTMLElement | null;
  bars: { attr: string }[];
  countUnit: string;
}) {
  const grid = document.getElementById(opts.gridId);
  const cells = Array.from(
    grid?.querySelectorAll<HTMLElement>(".project-cell") ?? [],
  );
  const active: Record<string, string> = {};
  opts.bars.forEach((b) => (active[b.attr] = "*"));
  let query = "";
  function apply() {
    let shown = 0;
    for (const cell of cells) {
      let ok = true;
      for (const b of opts.bars) {
        const v = active[b.attr];
        if (v === "*") continue;
        const cellVal = cell.dataset[b.attr] ?? "";
        if (b.attr === "stack" || b.attr === "status") {
          if (!cellVal.split("|").includes(v)) ok = false;
        } else if (cellVal !== v) ok = false;
      }
      if (
        ok &&
        query &&
        !(cell.textContent ?? "").toLowerCase().includes(query)
      )
        ok = false;
      cell.classList.toggle("hidden", !ok);
      if (ok) shown++;
    }
    if (opts.emptyEl) opts.emptyEl.toggleAttribute("hidden", shown !== 0);
    if (opts.countEl)
      opts.countEl.textContent =
        shown === cells.length
          ? `${cells.length} ${opts.countUnit}`
          : `${shown} of ${cells.length}`;
  }
  for (const b of opts.bars) {
    const bar = document.querySelector<HTMLElement>(`[data-bar="${b.attr}"]`);
    bar?.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>(
        `[data-${b.attr}]`,
      );
      if (!btn) return;
      active[b.attr] = btn.dataset[b.attr] ?? "*";
      bar
        .querySelectorAll<HTMLElement>(`[data-${b.attr}]`)
        .forEach((x) => x.setAttribute("aria-pressed", String(x === btn)));
      apply();
    });
  }
  const search = document.getElementById(
    "project-search",
  ) as HTMLInputElement | null;
  search?.addEventListener("input", () => {
    query = search.value.trim().toLowerCase();
    apply();
  });
  return { apply };
}

// Auto-rotating slider over .hero-slide children of #<rootId>. Loops ALL slides.
export function wireSlider(rootId: string, opts: { intervalMs?: number } = {}) {
  const root = document.getElementById(rootId);
  if (!root) return;
  const slides = Array.from(root.querySelectorAll<HTMLElement>(".hero-slide"));
  const dots = Array.from(root.querySelectorAll<HTMLElement>(".hero-dot"));
  if (slides.length <= 1) return;
  let i = 0,
    timer: number | undefined;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function show(n: number) {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("hidden", k !== i));
    dots.forEach((d, k) => d.setAttribute("aria-current", String(k === i)));
  }
  function start() {
    if (!reduce)
      timer = window.setInterval(() => show(i + 1), opts.intervalMs ?? 6000);
  }
  function stop() {
    if (timer) window.clearInterval(timer);
  }
  root.querySelector("[data-hero-prev]")?.addEventListener("click", () => {
    show(i - 1);
    stop();
    start();
  });
  root.querySelector("[data-hero-next]")?.addEventListener("click", () => {
    show(i + 1);
    stop();
    start();
  });
  dots.forEach((d, k) =>
    d.addEventListener("click", () => {
      show(k);
      stop();
      start();
    }),
  );
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", start);
  show(0);
  start();
}
