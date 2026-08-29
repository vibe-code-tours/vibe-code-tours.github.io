// src/components/gallery/deck-renderer.ts
// Inline marp deck renderer, moved verbatim from GalleryBody.astro. Lazy-loads
// Marp only when a deck is first shown.
function rewriteRelPaths(md: string, base: string) {
  const b = base.endsWith("/") ? base : base + "/";
  return md.replace(/(\]\()([^)]+)(\))/g, (m, open, target, close) => {
    const t = target.trim();
    if (/^(https?:|data:|#|mailto:)/i.test(t)) return m;
    return `${open}${b}${t.replace(/^\.?\//, "")}${close}`;
  });
}

let marpPromise: Promise<any> | null = null;
async function getMarp() {
  if (!marpPromise)
    marpPromise = import("@marp-team/marp-core").then(
      ({ Marp }) => new Marp({ html: false }),
    );
  return marpPromise;
}

let deckCallToken = 0;

export async function renderDeck(
  mount: HTMLElement,
  c: any,
  i18n: { loadingSlides: string; slidesUnavailable: string },
) {
  // Token lives on the DOM node so we can tell, after an await, whether a newer
  // call has started or the lightbox was closed in the meantime.
  const token = String(++deckCallToken);
  mount.dataset.deckToken = token;
  if (!c.slides_raw) {
    mount.innerHTML = "";
    return;
  }
  mount.innerHTML = `<p class="font-mono text-xs text-gray-500">${i18n.loadingSlides}</p>`;
  try {
    const res = await fetch(c.slides_raw);
    if (!res.ok) throw new Error(String(res.status));
    let md = await res.text();
    if (c.slides_base) md = rewriteRelPaths(md, c.slides_base);
    const marp = await getMarp();
    const { html, css } = marp.render(md);
    // Bail if a newer renderDeck call started, or the lightbox was closed (deck-mount cleared), while we were fetching/rendering.
    if (mount.dataset.deckToken !== token) return;
    // Marp emits a bespoke presenter <script>; the iframe already has
    // sandbox="" (no allow-scripts) so it can't run regardless — stripping
    // it here is defense-in-depth only, to avoid a benign CSP console error.
    const body = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    const srcdoc = `<!doctype html><html><head><meta charset="utf8"><style>${css}
      html,body{margin:0;background:#0b0b0d} .marpit{transform-origin:top left}</style></head><body>${body}</body></html>`;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "");
    iframe.className =
      "h-[46vh] w-full rounded-lg border border-white/10 bg-black";
    iframe.srcdoc = srcdoc;
    mount.innerHTML = "";
    mount.appendChild(iframe);
  } catch {
    if (mount.dataset.deckToken !== token) return;
    mount.innerHTML = `<a href="${c.repo_url}" target="_blank" rel="noopener noreferrer" class="font-mono text-xs text-gray-400 underline">${i18n.slidesUnavailable}</a>`;
  }
}
