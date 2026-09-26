"use client";

// Componente para texto estilo "ransom note" / recortes de revista
export default function RansomText({ text, className = "" }) {
  const words = text.split(" ");

  // Estilos aleatorios para cada palabra
  const getRandomStyle = (index) => {
    const styles = [
      "bg-gold text-bg px-2 py-1 rotate-[-2deg]",
      "bg-teal text-cream px-2 py-1 rotate-[1deg]",
      "bg-cream text-bg px-2 py-1 rotate-[-1deg]",
      "bg-transparent border-2 border-gold text-gold px-2 py-1 rotate-[2deg]",
      "bg-transparent border-2 border-cream text-cream px-2 py-1 rotate-[-3deg]",
      "bg-surface text-gold px-2 py-1 border border-gold/30 rotate-[1deg]",
    ];
    return styles[index % styles.length];
  };

  const getFontStyle = (index) => {
    const fonts = [
      "font-gothic",
      "font-display",
      "font-body font-bold",
      "font-display italic",
    ];
    return fonts[index % fonts.length];
  };

  return (
    <div className={`flex flex-wrap gap-2 items-center justify-center ${className}`}>
      {words.map((word, index) => (
        <span
          key={index}
          className={`
            inline-block text-lg sm:text-xl md:text-2xl
            ${getRandomStyle(index)}
            ${getFontStyle(index)}
            transform transition-transform hover:scale-105
            shadow-hard
          `}
          style={{
            animationDelay: `${index * 0.1}s`,
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}

// Versión para títulos grandes
export function RansomTitle({ children, className = "" }) {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Sombra offset */}
      <span className="absolute top-1 left-1 text-teal/50 font-gothic text-poster-xl">
        {children}
      </span>
      {/* Texto principal */}
      <span className="relative font-gothic text-poster-xl text-gold">
        {children}
      </span>
    </div>
  );
}
