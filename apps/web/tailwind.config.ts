import type { Config } from "tailwindcss";

export default {
  darkMode: "media",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
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
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        "glass-hover": "0 12px 40px 0 rgba(31, 38, 135, 0.4)",
        primary: "0 4px 20px 0 rgba(13, 127, 242, 0.3)",
        "primary-hover": "0 6px 25px 0 rgba(13, 127, 242, 0.4)",
      },
    },
  },
  plugins: [],
} satisfies Config;
