// src/components/gallery/shots-strip.ts
// Lazy multi-screenshot strip for the project lightbox. DOM-only, no deps.
export function renderShots(
  mount: HTMLElement,
  screenshots: string[],
  altPrefix = "Screenshot",
): void {
  if (!Array.isArray(screenshots) || screenshots.length <= 1) return;
  const wrap = document.createElement("div");
  wrap.className = "mb-3";

  const big = document.createElement("img");
  big.src = screenshots[0];
  big.loading = "lazy";
  big.alt = `${altPrefix} 1`;
  big.className =
    "mb-2 max-h-[46vh] w-full rounded-lg border border-white/10 object-contain bg-black";
  wrap.appendChild(big);

  const strip = document.createElement("div");
  strip.className = "flex gap-2 overflow-x-auto pb-1";
  screenshots.forEach((src, i) => {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className =
      "h-14 w-24 flex-none overflow-hidden rounded border border-white/10 transition hover:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 aria-[current=true]:border-accent-500";
    thumb.setAttribute("aria-current", String(i === 0));
    const im = document.createElement("img");
    im.src = src;
    im.loading = "lazy";
    im.alt = `${altPrefix} ${i + 1}`;
    im.className = "h-full w-full object-cover";
    thumb.appendChild(im);
    thumb.addEventListener("click", () => {
      big.src = src;
      big.alt = `${altPrefix} ${i + 1}`;
      strip
        .querySelectorAll("[aria-current]")
        .forEach((b) => b.setAttribute("aria-current", "false"));
      thumb.setAttribute("aria-current", "true");
    });
    strip.appendChild(thumb);
  });
  wrap.appendChild(strip);
  mount.appendChild(wrap);
}
