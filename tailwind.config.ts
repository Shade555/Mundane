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
        paper: {
          50: "#FCFBF9",
          100: "#FAF8F5",
          200: "#F4EFEA",
          300: "#EBE4DC",
          400: "#DDD4C8",
          DEFAULT: "#FAF8F5",
        },
        forest: {
          50: "#F1F6F3",
          100: "#E1EDE5",
          200: "#C3D9CB",
          300: "#92B9A0",
          400: "#5D9472",
          500: "#2E6047",
          600: "#244D38",
          700: "#1B3B2B",
          800: "#142B20",
          900: "#0D1D15",
          DEFAULT: "#1B3B2B",
        },
        charcoal: {
          50: "#F5F6F5",
          100: "#E6E7E6",
          200: "#CCCED0",
          300: "#9A9E9F",
          400: "#676C6D",
          500: "#44484A",
          600: "#2D312E",
          700: "#222523",
          800: "#191C1A",
          900: "#101211",
          DEFAULT: "#191C1A",
        },
        stone: {
          50: "#F9FAF9",
          100: "#EFEFEF",
          200: "#E2E3E1",
          300: "#C8CAC6",
          400: "#9DA09C",
          500: "#70736F",
          600: "#535652",
          700: "#3D3F3C",
          DEFAULT: "#70736F",
        },
        botanical: {
          amber: "#B86B35",
          terracotta: "#9E523A",
          sage: "#4A6B53",
          lichen: "#7B8A49",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "Menlo", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
