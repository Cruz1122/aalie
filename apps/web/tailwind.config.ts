import type { Config } from "tailwindcss";

export default {
  darkMode: "media",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0d7ff2",
        dark: {
          bg: "#101a23",
          card: "#182431",
          border: "#223649",
          text: "#90adcb",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "none",
        "glass-hover": "none",
        primary: "0 4px 20px 0 rgba(13, 127, 242, 0.3)",
        "primary-hover": "0 6px 25px 0 rgba(13, 127, 242, 0.4)",
      },
    },
  },
  plugins: [],
} satisfies Config;
