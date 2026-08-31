/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nueva paleta editorial
        bg: "#0A0A0A",
        "bg-secondary": "#111111",
        ink: "#F1EFE9",
        "ink-muted": "#9B9B9B",
        sage: "#A8B39A",
        "sage-dark": "#8A9A7C",
        line: "#222222",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      fontSize: {
        // Títulos responsive gigantes
        'hero': ['clamp(70px, 12vw, 180px)', { lineHeight: '0.85', letterSpacing: '-0.02em' }],
        'hero-sub': ['clamp(40px, 8vw, 100px)', { lineHeight: '0.9', letterSpacing: '-0.01em' }],
        'section': ['clamp(36px, 6vw, 80px)', { lineHeight: '0.95', letterSpacing: '-0.01em' }],
      },
      animation: {
        'ticker': 'ticker 30s linear infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
