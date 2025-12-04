import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        discord: {
          DEFAULT: "#5865F2",
          hover: "#4752C4",
        },
        // Cyberpunk neon colors
        neon: {
          cyan: "hsl(var(--neon-cyan))",
          pink: "hsl(var(--neon-pink))",
          purple: "hsl(var(--neon-purple))",
          yellow: "hsl(var(--neon-yellow))",
          green: "hsl(var(--neon-green))",
        },
        cyber: {
          dark: "#0a0a0f",
          darker: "#050508",
          card: "#0f0f18",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        cyber: ["var(--font-orbitron)", "Orbitron", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "neon-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 5px hsl(180 100% 50% / 0.5), 0 0 10px hsl(180 100% 50% / 0.3), 0 0 20px hsl(180 100% 50% / 0.2)",
          },
          "50%": {
            boxShadow: "0 0 10px hsl(180 100% 50% / 0.8), 0 0 20px hsl(180 100% 50% / 0.5), 0 0 40px hsl(180 100% 50% / 0.3)",
          },
        },
        "neon-pulse-pink": {
          "0%, 100%": {
            boxShadow: "0 0 5px hsl(320 100% 60% / 0.5), 0 0 10px hsl(320 100% 60% / 0.3), 0 0 20px hsl(320 100% 60% / 0.2)",
          },
          "50%": {
            boxShadow: "0 0 10px hsl(320 100% 60% / 0.8), 0 0 20px hsl(320 100% 60% / 0.5), 0 0 40px hsl(320 100% 60% / 0.3)",
          },
        },
        "text-flicker": {
          "0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%": {
            opacity: "1",
          },
          "20%, 21.999%, 63%, 63.999%, 65%, 69.999%": {
            opacity: "0.4",
          },
        },
        "border-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        "cyber-scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.5s infinite",
        "neon-pulse": "neon-pulse 2s ease-in-out infinite",
        "neon-pulse-pink": "neon-pulse-pink 2s ease-in-out infinite",
        "text-flicker": "text-flicker 3s infinite",
        "border-flow": "border-flow 3s linear infinite",
        "cyber-scan": "cyber-scan 2s linear infinite",
        float: "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      backgroundImage: {
        "cyber-grid": "linear-gradient(hsl(180 100% 50% / 0.03) 1px, transparent 1px), linear-gradient(90deg, hsl(180 100% 50% / 0.03) 1px, transparent 1px)",
        "cyber-gradient": "linear-gradient(135deg, hsl(180 100% 50% / 0.1) 0%, hsl(300 100% 50% / 0.1) 100%)",
        "neon-gradient": "linear-gradient(135deg, hsl(180 100% 50%) 0%, hsl(300 100% 50%) 100%)",
      },
      backgroundSize: {
        "cyber-grid": "50px 50px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
