import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#0f172a",
        ink: "#e2e8f0",
        accent: "#22d3ee",
        accentDark: "#0891b2",
        border: "#1e293b",
        panel: "#020617",
        muted: "#94a3b8",
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 18px 60px rgba(24, 24, 27, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
