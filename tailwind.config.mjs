/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        surface: {
          base: "#09090b",
          card: "#0f0f11",
          elevated: "#18181b",
        },
      },
      fontFamily: {
        // Latin renders in Inter; Myanmar glyphs fall through to MyanmarSquare
        // (matched by unicode-range in @font-face). Both weights preserved.
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "MyanmarSquare",
          "sans-serif",
        ],
        // Code/tags: JetBrains Mono for Latin, MyanmarSabae for Myanmar.
        mono: ["JetBrains Mono", "MyanmarSabae", "ui-monospace", "monospace"],
      },
      maxWidth: {
        prose: "70ch",
      },
      borderColor: {
        subtle: "#ffffff0a",
      },
    },
  },
  plugins: [],
};
