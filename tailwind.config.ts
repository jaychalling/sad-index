import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: "#8ecae6",
        teal: "#219ebc",
        navy: "#023047",
        amber: "#ffb703",
        orange: "#fb8500",
        happy: "#22c55e",
        sad: "#ef4444",
      },
    },
  },
  plugins: [],
};
export default config;
