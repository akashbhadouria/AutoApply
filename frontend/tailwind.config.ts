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
        canvas: "#f7f4ef",
        ink: "#18181b",
        accent: "#c96b3b",
        accentDark: "#9f4d21",
        border: "#ded4c7",
        panel: "#fffdf8",
        muted: "#6b655d",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 18px 60px rgba(24, 24, 27, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

