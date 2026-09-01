/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fondos
        bg: "#070707",
        "bg-dark": "#0A0A0A",
        surface: "#101010",
        "surface-light": "#141414",
        panel: "#181818",

        // Textos
        ink: "#F3F0E8",
        "ink-secondary": "#E8E5DD",
        muted: "#8D8D88",
        cement: "#6B6B66",

        // Amarillo protagonista
        gold: "#F5C400",
        "gold-dark": "#D4A900",
        "gold-light": "#FFD633",
        "gold-muted": "rgba(245, 196, 0, 0.15)",

        // Bordes
        line: "rgba(243,240,232,.08)",
        "line-light": "rgba(243,240,232,.15)",
        "line-gold": "rgba(245,196,0,.4)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      fontSize: {
        // Escala móvil primero
        'xs': ['11px', { lineHeight: '1.5', letterSpacing: '0.04em' }],
        'sm': ['13px', { lineHeight: '1.6', letterSpacing: '0.02em' }],
        'base': ['15px', { lineHeight: '1.7' }],
        'lg': ['17px', { lineHeight: '1.6' }],
        'xl': ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.3' }],
        '3xl': ['32px', { lineHeight: '1.2' }],
        // Display móvil
        'mobile-hero': ['clamp(42px, 12vw, 56px)', { lineHeight: '0.9', letterSpacing: '-0.02em' }],
        'mobile-title': ['clamp(32px, 9vw, 44px)', { lineHeight: '0.92', letterSpacing: '-0.015em' }],
        'mobile-section': ['clamp(28px, 8vw, 38px)', { lineHeight: '0.95', letterSpacing: '-0.01em' }],
        // Display desktop
        'display-sm': ['clamp(28px, 4vw, 40px)', { lineHeight: '0.95', letterSpacing: '-0.01em' }],
        'display-md': ['clamp(36px, 5vw, 56px)', { lineHeight: '0.92', letterSpacing: '-0.015em' }],
        'display-lg': ['clamp(44px, 6vw, 80px)', { lineHeight: '0.9', letterSpacing: '-0.02em' }],
        'hero': ['clamp(64px, 11vw, 160px)', { lineHeight: '0.85', letterSpacing: '-0.025em' }],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'touch': '52px',
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      maxWidth: {
        'mobile': '430px',
        'container': '1400px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'fade-in-scale': 'fadeInScale 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'slide-in-right': 'slideInRight 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'slide-out-left': 'slideOutLeft 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'draw': 'draw 0.8s ease forwards',
        'progress': 'progress 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'text-reveal': 'textReveal 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'shake': 'shake 0.5s ease-in-out',
        'check': 'check 0.3s ease forwards',
        'bounce-subtle': 'bounceSubtle 0.4s ease',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideOutLeft: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(-40px)' },
        },
        draw: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        progress: {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
        },
        pulseGold: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        textReveal: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        check: {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        bounceSubtle: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
