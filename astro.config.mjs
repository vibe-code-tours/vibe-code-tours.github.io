// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

// NOTE: `site` + `base` target GitHub Pages at vibe-code-tours.github.io/vibe-code-tours-site.
// When the custom domain (vibecode.tours) is live, set:
//   site: "https://vibecode.tours", base: "/"
// The link helper in src/i18n/utils.ts reads BASE_URL, so links adapt automatically.
export default defineConfig({
  site: "https://vibecode.tours",
  base: "/",
  trailingSlash: "ignore",
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
