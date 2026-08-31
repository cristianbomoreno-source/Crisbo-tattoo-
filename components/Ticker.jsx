export default function Ticker() {
  const items = [
    "BLACK & GREY",
    "REALISM",
    "CUSTOM PROJECTS",
    "BOGOTÁ",
  ];

  return (
    <section className="bg-accent overflow-hidden py-4 md:py-5">
      <div className="ticker-track">
        {[...items, ...items, ...items, ...items].map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-8 md:gap-12 px-8 md:px-12 whitespace-nowrap"
          >
            <span className="font-display text-xl md:text-2xl lg:text-[28px] text-bg tracking-wide">
              {item}
            </span>
            <span className="text-bg/50 text-sm">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}
