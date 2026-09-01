"use client";

// Estrella de 4 puntas
export function Star4({ className = "", size = 24, color = "gold", animate = true }) {
  const colorClass = color === "gold" ? "doodle-gold" : color === "teal" ? "doodle-teal" : "doodle-cream";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`doodle ${colorClass} ${animate ? "doodle-draw stagger-3" : ""} ${className}`}
    >
      <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z" />
    </svg>
  );
}

// Estrella de 6 puntas
export function Star6({ className = "", size = 28, color = "gold", animate = true }) {
  const colorClass = color === "gold" ? "doodle-gold" : color === "teal" ? "doodle-teal" : "doodle-cream";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      className={`doodle ${colorClass} ${animate ? "doodle-draw stagger-4" : ""} ${className}`}
    >
      <path d="M14 2L16 11L25 9L18 14L25 19L16 17L14 26L12 17L3 19L10 14L3 9L12 11L14 2Z" />
    </svg>
  );
}

// Flecha curva editorial
export function CurvedArrow({ className = "", size = 40, color = "gold", animate = true, direction = "right" }) {
  const colorClass = color === "gold" ? "doodle-gold" : color === "teal" ? "doodle-teal" : "doodle-cream";
  const transform = direction === "left" ? "scale(-1, 1)" : "";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={`doodle ${colorClass} ${animate ? "doodle-draw" : ""} ${className}`}
      style={{ transform }}
    >
      <path d="M8 28C8 16 16 8 28 8M28 8L20 4M28 8L24 16" />
    </svg>
  );
}

// Smiley estilo tattoo
export function Smiley({ className = "", size = 32, color = "gold", animate = true }) {
  const colorClass = color === "gold" ? "doodle-gold" : color === "teal" ? "doodle-teal" : "doodle-cream";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`doodle ${colorClass} ${animate ? "doodle-draw stagger-5" : ""} ${className}`}
    >
      <circle cx="16" cy="16" r="13" />
      <circle cx="11" cy="13" r="2" fill="currentColor" className={colorClass.replace("doodle-", "fill-")} />
      <circle cx="21" cy="13" r="2" fill="currentColor" className={colorClass.replace("doodle-", "fill-")} />
      <path d="M10 20C12 24 20 24 22 20" />
    </svg>
  );
}

// Corona
export function Crown({ className = "", size = 36, color = "gold", animate = true }) {
  const colorClass = color === "gold" ? "doodle-gold" : color === "teal" ? "doodle-teal" : "doodle-cream";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className={`doodle ${colorClass} ${animate ? "doodle-draw stagger-4" : ""} ${className}`}
    >
      <path d="M4 28L8 12L18 20L28 12L32 28H4Z" />
      <circle cx="8" cy="10" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="28" cy="10" r="2" />
    </svg>
  );
}

// Rayo
export function Lightning({ className = "", size = 28, color = "gold", animate = true }) {
  const colorClass = color === "gold" ? "doodle-gold" : color === "teal" ? "doodle-teal" : "doodle-cream";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      className={`doodle ${colorClass} ${animate ? "doodle-draw" : ""} ${className}`}
    >
      <path d="M16 2L8 14H14L12 26L20 14H14L16 2Z" />
    </svg>
  );
}

// Calavera lineal
export function Skull({ className = "", size = 32, color = "cream", animate = true }) {
  const colorClass = color === "gold" ? "doodle-gold" : color === "teal" ? "doodle-teal" : "doodle-cream";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`doodle ${colorClass} ${animate ? "doodle-draw" : ""} ${className}`}
    >
      <path d="M16 4C10 4 6 9 6 15C6 19 8 22 8 22V26H12V24H14V26H18V24H20V26H24V22C24 22 26 19 26 15C26 9 22 4 16 4Z" />
      <circle cx="12" cy="14" r="3" />
      <circle cx="20" cy="14" r="3" />
      <path d="M13 20H19" />
    </svg>
  );
}

// Línea ondulada
export function WavyLine({ className = "", width = 60, color = "gold", animate = true }) {
  const colorClass = color === "gold" ? "doodle-gold" : color === "teal" ? "doodle-teal" : "doodle-cream";

  return (
    <svg
      width={width}
      height="10"
      viewBox="0 0 60 10"
      className={`doodle ${colorClass} ${animate ? "doodle-draw" : ""} ${className}`}
    >
      <path d="M0 5C10 0 20 10 30 5C40 0 50 10 60 5" />
    </svg>
  );
}

// Círculo con X
export function CircleX({ className = "", size = 24, color = "teal", animate = true }) {
  const colorClass = color === "gold" ? "doodle-gold" : color === "teal" ? "doodle-teal" : "doodle-cream";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`doodle ${colorClass} ${animate ? "doodle-draw" : ""} ${className}`}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 8L16 16M16 8L8 16" />
    </svg>
  );
}

// Asterisco
export function Asterisk({ className = "", size = 20, color = "gold", animate = true }) {
  const colorClass = color === "gold" ? "doodle-gold" : color === "teal" ? "doodle-teal" : "doodle-cream";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className={`doodle ${colorClass} ${animate ? "doodle-draw" : ""} ${className}`}
    >
      <path d="M10 2V18M2 10H18M4 4L16 16M16 4L4 16" />
    </svg>
  );
}

// Flecha simple
export function Arrow({ className = "", size = 20, direction = "right" }) {
  const rotations = { right: 0, down: 90, left: 180, up: 270 };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className={className}
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

// Splash/Explosión
export function Splash({ className = "", size = 80, color = "gold" }) {
  const fillColor = color === "gold" ? "#F5C400" : color === "teal" ? "#1F8F87" : "#F1EBDD";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={`${className}`}
    >
      <path
        d="M40 5L45 25L60 10L50 30L75 25L55 40L75 55L50 50L60 70L45 55L40 75L35 55L20 70L30 50L5 55L25 40L5 25L30 30L20 10L35 25L40 5Z"
        fill={fillColor}
      />
    </svg>
  );
}
