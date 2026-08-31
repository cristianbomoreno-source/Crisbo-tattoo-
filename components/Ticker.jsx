export default function Ticker() {
  const items = [
    "BLACK & GREY",
    "REALISM",
    "CUSTOM PROJECTS",
    "BOGOTA",
    "BLACK & GREY",
    "REALISM",
    "CUSTOM PROJECTS",
    "BOGOTA",
  ];

  return (
    <section className="bg-sage overflow-hidden py-4 md:py-5">
      <div className="ticker-track">
        {/* Duplicamos el contenido para el loop infinito */}
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-6 md:gap-10 px-6 md:px-10 whitespace-nowrap"
          >
            <span className="font-display text-xl md:text-2xl lg:text-3xl text-bg tracking-wide">
              {item}
            </span>
            <span className="text-bg/60 text-lg">&#10022;</span>
          </span>
        ))}
      </div>
    </section>
  );
}
