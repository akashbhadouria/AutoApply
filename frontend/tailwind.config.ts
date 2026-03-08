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
        canvas: "#030712",
        ink: "#f1f5f9",
        accent: "#22d3ee",
        accentDark: "#0891b2",
        border: "#1e293b",
        panel: "#030712",
        muted: "#64748b",
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        panel: "0 18px 60px rgba(0, 0, 0, 0.4)",
        "glow-cyan": "0 0 20px rgba(34,211,238,0.25), 0 0 60px rgba(34,211,238,0.08)",
        "glow-violet": "0 0 20px rgba(168,85,247,0.25), 0 0 60px rgba(168,85,247,0.08)",
        "glow-pink": "0 0 20px rgba(244,63,94,0.25), 0 0 60px rgba(244,63,94,0.08)",
        "glow-emerald": "0 0 20px rgba(52,211,153,0.25), 0 0 60px rgba(52,211,153,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
