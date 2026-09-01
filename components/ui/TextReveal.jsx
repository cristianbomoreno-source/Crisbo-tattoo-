"use client";

export default function TextReveal({ children, className = "", as: Tag = "h2" }) {
  // Dividir el texto en líneas (si es un string)
  const lines = typeof children === "string" ? children.split("\n") : [children];

  return (
    <Tag className={`text-reveal-container ${className}`}>
      {lines.map((line, i) => (
        <span key={i} className="text-reveal-line">
          {line}
        </span>
      ))}
    </Tag>
  );
}

// Para títulos con partes en diferentes colores
export function TitleReveal({ lines, className = "" }) {
  return (
    <h2 className={`text-reveal-container font-display ${className}`}>
      {lines.map((line, i) => (
        <span
          key={i}
          className={`text-reveal-line ${line.gold ? "text-gold" : "text-ink"}`}
          style={{ animationDelay: `${0.1 + i * 0.1}s` }}
        >
          {line.text}
        </span>
      ))}
    </h2>
  );
}
