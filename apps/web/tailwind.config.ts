import type { Config } from "tailwindcss";
import baseConfig from "@cleanaglow/config/tailwind.config";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/types/src/**/*.{js,ts,jsx,tsx}"
  ],
  presets: [baseConfig as any],
  plugins: []
};

export default config;
