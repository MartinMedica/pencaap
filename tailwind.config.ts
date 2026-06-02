import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101820",
        pitch: "#0E7C66",
        sun: "#F5C542",
        coral: "#E85D4F"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(16, 24, 32, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
