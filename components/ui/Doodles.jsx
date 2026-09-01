"use client";

// Estrella
export function Star({ className = "", size = 24, animate = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`doodle ${animate ? "doodle-draw" : ""} ${className}`}
    >
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
    </svg>
  );
}

// Flecha curva
export function CurvedArrow({ className = "", size = 32, animate = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`doodle ${animate ? "doodle-draw" : ""} ${className}`}
    >
      <path d="M6 20C6 12 12 6 20 6M20 6L14 4M20 6L18 12" />
    </svg>
  );
}

// Corona
export function Crown({ className = "", size = 32, animate = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`doodle ${animate ? "doodle-draw" : ""} ${className}`}
    >
      <path d="M4 24L8 10L16 16L24 10L28 24H4Z" />
      <circle cx="8" cy="8" r="2" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="24" cy="8" r="2" />
    </svg>
  );
}

// Smiley
export function Smiley({ className = "", size = 24, animate = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`doodle ${animate ? "doodle-draw" : ""} ${className}`}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="8" cy="10" r="1" fill="currentColor" />
      <circle cx="16" cy="10" r="1" fill="currentColor" />
      <path d="M8 15C9.5 17 14.5 17 16 15" />
    </svg>
  );
}

// Círculo con línea
export function CircleLine({ className = "", size = 24, animate = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`doodle ${animate ? "doodle-draw" : ""} ${className}`}
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12H20" />
    </svg>
  );
}

// Asterisco
export function Asterisk({ className = "", size = 24, animate = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`doodle ${animate ? "doodle-draw" : ""} ${className}`}
    >
      <path d="M12 4V20M4 12H20M6 6L18 18M18 6L6 18" />
    </svg>
  );
}

// Flecha simple
export function Arrow({ className = "", size = 20, direction = "right" }) {
  const rotations = {
    right: 0,
    down: 90,
    left: 180,
    up: 270,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className={`${className}`}
      style={{ transform: `rotate(${rotations[direction]}deg)` }}
    >
      <path
        d="M4 10H16M16 10L11 5M16 10L11 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// Check animado
export function AnimatedCheck({ className = "", size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`text-bg ${className}`}
    >
      <path
        d="M5 12L10 17L19 8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="doodle-draw"
        style={{ strokeDasharray: 30, strokeDashoffset: 30 }}
      />
    </svg>
  );
}
