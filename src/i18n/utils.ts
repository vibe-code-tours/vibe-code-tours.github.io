import en from "./en.json";
import my from "./my.json";

export type Locale = "en" | "my";
export const locales: Locale[] = ["en", "my"];
export const defaultLocale: Locale = "en";

const dictionaries = { en, my } as const;

/** Strings dictionary for a locale. */
export function t(locale: Locale): typeof en {
  return (dictionaries[locale] ?? dictionaries.en) as typeof en;
}

/** Detect the active locale from a URL pathname (handles base path). */
export function getLocale(pathname: string): Locale {
  // Strip the configured base so /vibe-code-tours-site/my/... resolves correctly.
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  let path = pathname;
  if (base && path.startsWith(base)) path = path.slice(base.length);
  return path === "/my" || path.startsWith("/my/") ? "my" : "en";
}

/**
 * Build a locale-aware, base-prefixed URL.
 * localizedPath('/about', 'my') -> '/vibe-code-tours-site/my/about'
 * localizedPath('/about', 'en') -> '/vibe-code-tours-site/about'
 */
export function localizedPath(path: string, locale: Locale): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const clean = path === "/" ? "" : path;
  const prefix = locale === "en" ? "" : "/my";
  const out = `${base}${prefix}${clean}`;
  return out === "" ? "/" : out;
}

/** Toggle to the other locale, preserving the current sub-path. */
export function altLocaleHref(pathname: string): string {
  const current = getLocale(pathname);
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  let path = pathname;
  if (base && path.startsWith(base)) path = path.slice(base.length);
  if (current === "my") {
    path = path.replace(/^\/my/, "") || "/";
    return localizedPath(path, "en");
  }
  return localizedPath(path || "/", "my");
}
