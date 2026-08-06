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
        "tingub-blue": "#1B3B8C",
        "tingub-green": "#1E6B3A",
        "tingub-gold": "#F5A623",
        "tingub-orange": "#E8720C",
        ink: "#1A1A1A",
        paper: "#FAFAF8",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "8px",
        md: "8px",
        sm: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
