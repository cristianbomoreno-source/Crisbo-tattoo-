/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#050505",
        "bg-secondary": "#050505",
        "bg-grey": "#0c0c0c",
        ink: "#F5F5F5",
        gold: "#F7C400",
        "gold-2": "#FFCC29",
        line: "#2D2D2D",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        brush: ["var(--font-brush)", "cursive"],
      },
      backgroundImage: {
        "grain": "url('/images/noise.png')",
      },
      boxShadow: {
        "gold-glow": "0 0 40px rgba(247,196,0,0.25)",
      },
      animation: {
        "float-slow": "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
};
