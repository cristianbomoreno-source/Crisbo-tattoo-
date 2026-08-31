/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta definitiva - simplificada y consistente
        bg: "#0A0A0A",
        surface: "#111111",

        // Textos
        ink: "#F1EFE9",
        muted: "#9A9993",
        cement: "#77766F",

        // Acento - usar con moderación (5-7%)
        accent: "#A6B08F",
        "accent-dark": "#788064",

        // Bordes
        line: "rgba(241,239,233,.10)",
        "line-accent": "rgba(166,176,143,.45)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      fontSize: {
        // Escala tipográfica consistente
        'xs': ['11px', { lineHeight: '1.5', letterSpacing: '0.02em' }],
        'sm': ['13px', { lineHeight: '1.6', letterSpacing: '0.01em' }],
        'base': ['15px', { lineHeight: '1.7' }],
        'lg': ['17px', { lineHeight: '1.6' }],
        'xl': ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.3' }],
        // Display scale
        'display-sm': ['clamp(28px, 4vw, 40px)', { lineHeight: '0.95', letterSpacing: '-0.01em' }],
        'display-md': ['clamp(36px, 5vw, 56px)', { lineHeight: '0.92', letterSpacing: '-0.015em' }],
        'display-lg': ['clamp(44px, 6vw, 80px)', { lineHeight: '0.9', letterSpacing: '-0.02em' }],
        'display-xl': ['clamp(56px, 8vw, 120px)', { lineHeight: '0.88', letterSpacing: '-0.02em' }],
        'hero': ['clamp(64px, 11vw, 160px)', { lineHeight: '0.85', letterSpacing: '-0.025em' }],
        'hero-sub': ['clamp(36px, 6vw, 80px)', { lineHeight: '0.9', letterSpacing: '-0.01em' }],
      },
      spacing: {
        // Espaciado vertical para secciones
        'section-sm': 'clamp(80px, 12vw, 120px)',
        'section': 'clamp(100px, 15vw, 160px)',
        'section-lg': 'clamp(120px, 18vw, 200px)',
      },
      maxWidth: {
        'container': '1400px',
        'prose': '620px',
      },
      animation: {
        'ticker': 'ticker 40s linear infinite',
        'reveal': 'reveal 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'editorial': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
