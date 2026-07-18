/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        lg: "2rem",
      },
    },
    extend: {
      colors: {
        // Apple 经典配色
        ink: {
          DEFAULT: "#1d1d1f",
          soft: "#424245",
          muted: "#6e6e73",
          faint: "#86868b",
        },
        paper: {
          DEFAULT: "#ffffff",
          subtle: "#f5f5f7",
          card: "#fbfbfd",
        },
        accent: {
          DEFAULT: "#0071e3",
          hover: "#0077ed",
          pressed: "#006edb",
          soft: "#e8f1fd",
        },
        success: "#1a7f37",
        warning: "#b25000",
        danger: "#d70015",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Segoe UI",
          "Noto Sans",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        display: [
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      fontSize: {
        // 苹果官方字号梯度
        caption: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.01em" }],
        footnote: ["0.8125rem", { lineHeight: "1.1rem" }],
        body: ["1.0625rem", { lineHeight: "1.6" }],
        headline: ["1.25rem", { lineHeight: "1.5", letterSpacing: "-0.01em" }],
        title: ["1.75rem", { lineHeight: "1.3", letterSpacing: "-0.02em" }],
        large: ["2.5rem", { lineHeight: "1.2", letterSpacing: "-0.025em" }],
        hero: ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
      },
      borderRadius: {
        apple: "12px",
        "apple-lg": "18px",
        "apple-xl": "22px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
        card: "0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        elevated: "0 12px 32px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
        ring: "0 0 0 4px rgba(0,113,227,0.18)",
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.4, 0.0, 0.2, 1)",
        "apple-out": "cubic-bezier(0.0, 0.0, 0.2, 1)",
        "apple-in-out": "cubic-bezier(0.42, 0.0, 0.58, 1)",
      },
      transitionDuration: {
        "200-apple": "200ms",
        "300-apple": "300ms",
        "400-apple": "400ms",
        "500-apple": "500ms",
      },
      backdropBlur: {
        apple: "20px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "fade-in": "fade-in 400ms cubic-bezier(0.4, 0.0, 0.2, 1)",
        "slide-in-right": "slide-in-right 350ms cubic-bezier(0.0, 0.0, 0.2, 1)",
        "soft-pulse": "soft-pulse 2s cubic-bezier(0.4, 0.0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};
