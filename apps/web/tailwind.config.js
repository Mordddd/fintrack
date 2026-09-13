/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        canvas: "#FAFAF9",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#1C1917",
          secondary: "#78716C",
          muted: "#A8A29E",
        },
        border: {
          DEFAULT: "rgba(0,0,0,0.06)",
          strong: "rgba(0,0,0,0.12)",
        },
        accent: {
          DEFAULT: "#059669",
          light: "#D1FAE5",
          dark: "#065F46",
        },
        negative: {
          DEFAULT: "#DC2626",
          light: "#FEE2E2",
          dark: "#991B1B",
        },
        warning: {
          DEFAULT: "#D97706",
          light: "#FEF3C7",
        },
      },
      borderRadius: {
        card: "1.25rem",
        "card-inner": "calc(1.25rem - 0.375rem)",
      },
      boxShadow: {
        whisper: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        lifted: "0 4px 16px rgba(0,0,0,0.06)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.32, 0.72, 0, 1)",
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
