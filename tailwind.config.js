/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Negros
        bg: "#070707",
        "bg-dark": "#0A0A0A",
        surface: "#111111",
        "surface-light": "#151515",
        panel: "#1a1a1a",

        // Blancos
        cream: "#F1EBDD",
        "cream-light": "#F4F0E8",
        ink: "#F1EBDD",

        // Amarillo protagonista
        gold: "#F5C400",
        "gold-light": "#FFC400",
        "gold-dark": "#D9A800",
        "gold-muted": "rgba(245, 196, 0, 0.15)",

        // Teal secundario
        teal: "#1F8F87",
        "teal-light": "#2C9F94",
        "teal-dark": "#187A73",
        "teal-muted": "rgba(31, 143, 135, 0.15)",

        // Grises
        muted: "#8A8A84",
        cement: "#4A4A46",

        // Bordes
        line: "rgba(241, 235, 221, 0.08)",
        "line-light": "rgba(241, 235, 221, 0.15)",
        "line-gold": "rgba(245, 196, 0, 0.4)",
        "line-teal": "rgba(31, 143, 135, 0.4)",
      },
      fontFamily: {
        // Gótica/Blackletter para títulos principales
        gothic: ["var(--font-gothic)", "serif"],
        // Display fuerte para secundarios
        display: ["var(--font-display)", "sans-serif"],
        // Body legible
        body: ["var(--font-body)", "sans-serif"],
      },
      fontSize: {
        // Mobile scale
        'xs': ['11px', { lineHeight: '1.5', letterSpacing: '0.04em' }],
        'sm': ['13px', { lineHeight: '1.6', letterSpacing: '0.02em' }],
        'base': ['15px', { lineHeight: '1.7' }],
        'lg': ['17px', { lineHeight: '1.6' }],
        'xl': ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.3' }],
        '3xl': ['32px', { lineHeight: '1.15' }],
        // Editorial display
        'poster-sm': ['clamp(28px, 8vw, 40px)', { lineHeight: '0.95', letterSpacing: '-0.01em' }],
        'poster-md': ['clamp(36px, 10vw, 52px)', { lineHeight: '0.92', letterSpacing: '-0.015em' }],
        'poster-lg': ['clamp(44px, 12vw, 72px)', { lineHeight: '0.88', letterSpacing: '-0.02em' }],
        'poster-xl': ['clamp(52px, 14vw, 90px)', { lineHeight: '0.85', letterSpacing: '-0.02em' }],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      minHeight: {
        'touch': '52px',
        'screen-safe': 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      borderRadius: {
        'torn': '2px 8px 4px 12px',
        'torn-alt': '8px 2px 12px 4px',
      },
      boxShadow: {
        'hard': '4px 4px 0 0 rgba(0,0,0,0.8)',
        'hard-gold': '4px 4px 0 0 rgba(245,196,0,0.3)',
        'hard-teal': '4px 4px 0 0 rgba(31,143,135,0.3)',
        'print': '2px 2px 0 0 rgba(0,0,0,0.9)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease forwards',
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'slide-in': 'slideIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'reveal-up': 'revealUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'reveal-mask': 'revealMask 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'draw': 'draw 0.8s ease forwards',
        'draw-slow': 'draw 1.2s ease forwards',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'stamp': 'stamp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'tape': 'tape 0.6s ease forwards',
        'word-reveal': 'wordReveal 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'photo-reveal': 'photoReveal 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'sticker-pop': 'stickerPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        revealUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        revealMask: {
          '0%': { clipPath: 'inset(100% 0 0 0)' },
          '100%': { clipPath: 'inset(0 0 0 0)' },
        },
        draw: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        stamp: {
          '0%': { transform: 'scale(1.5) rotate(-10deg)', opacity: '0' },
          '60%': { transform: 'scale(0.95) rotate(2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        tape: {
          '0%': { transform: 'translateY(-20px) rotate(-5deg)', opacity: '0' },
          '100%': { transform: 'translateY(0) rotate(-3deg)', opacity: '1' },
        },
        wordReveal: {
          '0%': { opacity: '0', transform: 'translateY(100%) rotateX(-90deg)' },
          '100%': { opacity: '1', transform: 'translateY(0) rotateX(0deg)' },
        },
        photoReveal: {
          '0%': { clipPath: 'inset(100% 0 0 0)', transform: 'scale(1.05)' },
          '100%': { clipPath: 'inset(0 0 0 0)', transform: 'scale(1)' },
        },
        stickerPop: {
          '0%': { transform: 'scale(0) rotate(-20deg)', opacity: '0' },
          '60%': { transform: 'scale(1.2) rotate(5deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
