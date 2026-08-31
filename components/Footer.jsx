import { Instagram, MessageCircle } from "lucide-react";

const navigation = [
  { label: "Trabajos", href: "#trabajos" },
  { label: "Sobre mi", href: "#sobre-mi" },
  { label: "Estudio", href: "#estudio" },
  { label: "FAQ", href: "#faq" },
];

const social = [
  {
    label: "Instagram",
    href: "https://instagram.com/crisbotattoo",
    icon: Instagram,
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/573202107769",
    icon: MessageCircle,
  },
];

export default function Footer() {
  return (
    <footer className="bg-bg-secondary border-t border-line">
      {/* Main Footer */}
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 lg:px-12 py-16 md:py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <p className="font-display text-4xl md:text-5xl text-ink">CRISBO</p>
            <p className="label mt-2">TATTOO ARTIST</p>
            <p className="mt-6 text-ink-muted text-sm max-w-sm">
              Bogota, Colombia<br />
              Disenos personalizados en Black & Grey y Realismo.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="label mb-6">NAVEGACION</p>
            <ul className="space-y-3">
              {navigation.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-ink-muted hover:text-ink transition-colors text-sm"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="label mb-6">CONTACTO</p>
            <ul className="space-y-3">
              {social.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-ink-muted hover:text-ink transition-colors text-sm"
                  >
                    <item.icon size={16} />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <p className="label mb-2">UBICACION</p>
              <p className="text-ink-muted text-sm">
                Colina Campestre<br />
                Cl. 137b #57b - 39, piso 2
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-line">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 lg:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-ink-muted text-xs">
            &copy; {new Date().getFullYear()} Crisbo Tattoo. Todos los derechos reservados.
          </p>

          {/* Decorative Brand */}
          <p className="font-display text-6xl md:text-7xl text-ink/[0.03] select-none">
            CRISBO&trade;
          </p>
        </div>
      </div>
    </footer>
  );
}
