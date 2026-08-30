// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

// NOTE: `site` + `base` target GitHub Pages at vibe-code-tours.github.io/vibe-code-tours-site.
// When the custom domain (vibecode.tours) is live, set:
//   site: "https://vibecode.tours", base: "/"
// The link helper in src/i18n/utils.ts reads BASE_URL, so links adapt automatically.
// Fork previews are served from <owner>.github.io/<repo>/ and need that
// subpath as base; the vibe-code-tours org repo and local builds keep "/".
const [ghOwner, ghRepo] = (process.env.GITHUB_REPOSITORY ?? "/").split("/");
const forkBase = ghOwner && ghOwner !== "vibe-code-tours" ? `/${ghRepo}` : "/";

export default defineConfig({
  site: "https://vibecode.tours",
  base: forkBase,
  trailingSlash: "ignore",
  redirects: {
    // Redirect destinations are not base-aware, so prefix them manually.
    "/gallery": `${forkBase.replace(/\/$/, "")}/projects/personal`,
    "/my/gallery": `${forkBase.replace(/\/$/, "")}/my/projects/personal`,
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "my"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    tailwind(),
    sitemap({ filter: (page) => !page.includes("/repo-access") }),
  ],
});
