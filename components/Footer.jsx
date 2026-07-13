import { MapPin, Clock, MessageCircle, Instagram } from "lucide-react";
import Image from "next/image";

const MAPS_URL = "https://share.google/qeywmW0E0sMJvThim";

const items = [
  {
    icon: MapPin,
    label: "Ubicación",
    value: (
      <>
        Cl. 137b #57b - 39, piso 2
        <br />
        Bogotá, Colombia
      </>
    ),
    href: MAPS_URL,
  },
  {
    icon: Clock,
    label: "Horario",
    value: (
      <>
        Lunes a Sábado
        <br />
        10:00 a.m. – 7:00 p.m.
      </>
    ),
  },
  {
    icon: MessageCircle,
    label: "Contacto",
    value: (
      <>
        +57 320 210 7769
        <br />
        DM en Instagram
      </>
    ),
    href: "https://wa.me/573202107769",
  },
  {
    icon: Instagram,
    label: "Sígueme",
    value: "@crisbotattoo",
  },
];

export default function Footer() {
  return (
    <footer id="contacto" className="border-t border-line/60 bg-bg-secondary py-14">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {items.map((it) => {
            const Wrapper = it.href ? "a" : "div";
            const wrapperProps = it.href
              ? { href: it.href, target: "_blank", rel: "noopener noreferrer" }
              : {};
            return (
              <Wrapper key={it.label} {...wrapperProps} className="flex gap-4">
                <it.icon size={19} strokeWidth={1.5} className="text-gold-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-ink/40 mb-1.5">
                    {it.label}
                  </p>
                  <p className="text-sm leading-relaxed">{it.value}</p>
                </div>
              </Wrapper>
            );
          })}
        </div>

        <div className="border-t border-line/60 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-ink/40">
          <p>© {new Date().getFullYear()} Crisbo Tattoo — Todos cargamos una historia que merece ser contada.</p>
          <Image
            src="/images/logo-white.png"
            alt="Crisbo Tattoo Studio"
            width={120}
            height={144}
            className="h-9 w-auto opacity-90"
          />
        </div>
      </div>
    </footer>
  );
}
