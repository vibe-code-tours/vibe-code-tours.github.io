// src/lib/gallery-dom.ts — shared client-side gallery behaviors.
import {
  parseFilterQuery,
  serializeFilterQuery,
  sortCards,
} from "./gallery-filter.mjs";

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
  sortSelectId?: string;
  defaultSort?: string;
}) {
  const grid = document.getElementById(opts.gridId);
  const cells = Array.from(
    grid?.querySelectorAll<HTMLElement>(".project-cell") ?? [],
  );
  cells.forEach((c, i) => (c.dataset.order = String(i)));

  const defaultSort = opts.defaultSort ?? "chapter";
  const init = parseFilterQuery(location.search, defaultSort);
  const initActive = init.active as Record<string, string>;
  const active: Record<string, string> = {};
  opts.bars.forEach((b) => (active[b.attr] = initActive[b.attr] ?? "*"));
  let query = init.query;
  let sort = init.sort;

  function persist() {
    const q = serializeFilterQuery({ active, query, sort }, defaultSort);
    history.replaceState(null, "", q ? `?${q}` : location.pathname);
  }

  function reorder() {
    if (!grid) return;
    const meta = cells.map((cell) => ({
      cell,
      title: cell.dataset.title ?? cell.textContent ?? "",
      chapter: Number(cell.dataset.chapter ?? "-1"),
      order: Number(cell.dataset.order ?? "0"),
    }));
    for (const m of sortCards(meta, sort)) grid.appendChild(m.cell);
  }

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
    persist();
  }

  for (const b of opts.bars) {
    const bar = document.querySelector<HTMLElement>(`[data-bar="${b.attr}"]`);
    // hydrate pressed state from URL
    bar
      ?.querySelectorAll<HTMLElement>(`[data-${b.attr}]`)
      .forEach((x) =>
        x.setAttribute(
          "aria-pressed",
          String((x.dataset[b.attr] ?? "*") === active[b.attr]),
        ),
      );
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
  if (search) {
    search.value = query;
    search.addEventListener("input", () => {
      query = search.value.trim().toLowerCase();
      apply();
    });
  }

  const sortSel = opts.sortSelectId
    ? (document.getElementById(opts.sortSelectId) as HTMLSelectElement | null)
    : null;
  if (sortSel) {
    sortSel.value = sort;
    sortSel.addEventListener("change", () => {
      sort = sortSel.value;
      reorder();
      apply();
    });
  }

  reorder();
  apply();
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

// Shared "open a link in a new tab" button used inside the lightbox detail
// panel. `primary` renders the accent-filled variant (teams uses it for the
// live-demo link); personal never passes it, so it stays the outline style.
export function linkBtn(
  label: string,
  href: string,
  primary = false,
): HTMLAnchorElement {
  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.textContent = label;
  a.className = primary
    ? "rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-accent-600"
    : "rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-accent-500 hover:bg-accent-500 hover:text-black";
  return a;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// Owns the generic lightbox chrome (#lightbox / #lb-media / #lightbox-close)
// shared by PersonalGallery and TeamsGallery: opening/closing, scroll lock,
// grid-cell + hero-select wiring, and focus management. Callers supply a
// `populate` callback that fills in the type-specific detail markup (avatar,
// title, tags, links, and the deck/video mount).
export function wireLightbox<T = any>(opts: {
  heroId: string;
  datasetKey: string;
  populate: (media: HTMLElement, data: T) => void;
}) {
  const lb = document.getElementById("lightbox");
  const media = document.getElementById("lb-media");
  const closeBtn = document.getElementById("lightbox-close");
  if (!lb || !media) return { open: () => {}, close: () => {} };

  let opener: HTMLElement | null = null;

  function open(data: T, triggerEl?: HTMLElement | null) {
    if (!lb || !media) return;
    opener = triggerEl ?? (document.activeElement as HTMLElement | null);
    opts.populate(media, data);
    lb.classList.remove("hidden");
    lb.classList.add("flex");
    lockScroll(true);
    closeBtn?.focus();
  }

  function close() {
    if (!lb || !media) return;
    lb.classList.add("hidden");
    lb.classList.remove("flex");
    lockScroll(false);
    media.innerHTML = "";
    media.dataset.deckToken = "closed";
    opener?.focus();
    opener = null;
  }

  function trapTab(e: KeyboardEvent) {
    if (!lb) return;
    const focusable = Array.from(
      lb.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((el) => el.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  document
    .querySelectorAll<HTMLElement>("#gallery-grid .project-cell")
    .forEach((cell) =>
      cell.addEventListener("click", (e) => {
        const nl = (e.target as HTMLElement).closest<HTMLElement>(
          "[data-nolightbox]",
        );
        if (nl) {
          const href = nl.dataset.href;
          if (href) window.open(href, "_blank", "noopener");
          return;
        }
        try {
          open(JSON.parse(cell.dataset[opts.datasetKey] ?? "{}"), cell);
        } catch (err) {
          console.error(
            `wireLightbox: failed to parse cell dataset.${opts.datasetKey}`,
            err,
          );
        }
      }),
    );

  document.getElementById(opts.heroId)?.addEventListener("hero-select", (e) => {
    const i = (e as CustomEvent).detail as number;
    const cells = document.querySelectorAll<HTMLElement>(
      "#gallery-grid .project-cell",
    );
    const cell = cells[i];
    if (!cell) return;
    try {
      const slide = document
        .getElementById(opts.heroId)
        ?.querySelectorAll<HTMLElement>(".hero-slide")[i];
      open(JSON.parse(cell.dataset[opts.datasetKey] ?? "{}"), slide ?? cell);
    } catch (e) {
      console.error(
        `wireLightbox: failed to parse hero-select cell dataset.${opts.datasetKey}`,
        e,
      );
    }
  });

  closeBtn?.addEventListener("click", close);
  lb.addEventListener("click", (e) => {
    if (e.target === lb) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    else if (e.key === "Tab" && lb!.classList.contains("flex")) trapTab(e);
  });

  return { open, close };
}
