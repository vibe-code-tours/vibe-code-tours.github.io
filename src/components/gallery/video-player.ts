// src/components/gallery/video-player.ts
import { ogFallback } from "../../lib/gallery-dom";

type Team = {
  title: string;
  youtube_id?: string | null;
  youtube_url?: string | null;
  drive_id?: string | null;
  live_url?: string | null;
  repo_url: string;
};
type I18n = {
  playerYouTube: string;
  playerDrive: string;
  videoUnavailable: string;
};

function iframe(src: string, title: string) {
  const f = document.createElement("iframe");
  f.src = src;
  f.title = title;
  f.loading = "lazy";
  f.setAttribute(
    "allow",
    "accelerometer; encrypted-media; picture-in-picture; fullscreen",
  );
  f.setAttribute("allowfullscreen", "");
  f.className =
    "aspect-video w-full rounded-lg border border-white/10 bg-black";
  return f;
}

export function mountPlayer(mount: HTMLElement, t: Team, i18n: I18n) {
  mount.innerHTML = "";
  const ytSrc = t.youtube_id
    ? `https://www.youtube.com/embed/${t.youtube_id}`
    : null;
  const drSrc = t.drive_id
    ? `https://drive.google.com/file/d/${t.drive_id}/preview`
    : null;

  if (ytSrc || drSrc) {
    let current = ytSrc ?? drSrc!;
    const frameWrap = document.createElement("div");
    frameWrap.appendChild(iframe(current, `${t.title} demo`));
    // Toggle only when BOTH sources exist.
    if (ytSrc && drSrc) {
      const bar = document.createElement("div");
      bar.className = "mt-2 flex gap-1";
      const mk = (label: string, src: string) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        b.className =
          "rounded-md bg-surface-elevated px-2 py-1 font-mono text-[10px] text-gray-400 aria-pressed:bg-accent-500 aria-pressed:text-black";
        b.setAttribute("aria-pressed", String(src === current));
        b.addEventListener("click", () => {
          current = src;
          frameWrap.innerHTML = "";
          frameWrap.appendChild(iframe(src, `${t.title} demo`));
          bar
            .querySelectorAll("button")
            .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        });
        return b;
      };
      bar.append(mk(i18n.playerYouTube, ytSrc), mk(i18n.playerDrive, drSrc));
      mount.append(frameWrap, bar);
    } else {
      mount.appendChild(frameWrap);
    }
    return;
  }

  // No video: teams.json has no screenshot field, so always fall back to the
  // GitHub OG card for the team's repo (always available, never re-hosted).
  const img = document.createElement("img");
  img.src = ogFallback(t.repo_url);
  img.alt = `${t.title} repository preview`;
  img.loading = "lazy";
  img.className =
    "aspect-video w-full rounded-lg border border-white/10 object-cover bg-black";
  const note = document.createElement("p");
  note.className = "mt-2 font-mono text-xs text-gray-500";
  note.textContent = i18n.videoUnavailable;
  mount.append(img, note);
}
