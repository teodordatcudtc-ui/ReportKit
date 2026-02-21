import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // MetricLens palette
        slate: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          900: "#0F172A",
        },
        blue: {
          500: "#3B82F6",
          700: "#1E40AF",
        },
        rk: {
          green: "#10B981",
          red: "#EF4444",
          amber: "#F59E0B",
        },
      },
      fontFamily: {
        display: ["var(--font-instrument-serif)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        rk: "10px",
        "rk-sm": "6px",
        "rk-lg": "16px",
        "rk-xl": "24px",
      },
      boxShadow: {
        rk: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
        "rk-md": "0 4px 12px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.05)",
        "rk-lg": "0 12px 32px rgba(15,23,42,0.10), 0 4px 8px rgba(15,23,42,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
