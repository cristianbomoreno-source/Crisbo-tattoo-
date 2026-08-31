"use client";

import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";

const links = [
  { label: "TRABAJOS", href: "#trabajos" },
  { label: "SOBRE MI", href: "#sobre-mi" },
  { label: "ESTUDIO", href: "#estudio" },
  { label: "FAQ", href: "#faq" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cerrar menú móvil con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevenir scroll cuando menú está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-bg/90 backdrop-blur-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-[1400px] mx-auto px-5 md:px-8 lg:px-12 h-[70px] md:h-[80px] flex items-center justify-between">
        {/* Logo */}
        <a
          href="#inicio"
          className="font-display text-2xl md:text-3xl tracking-wide text-ink hover:text-sage transition-colors"
        >
          CRISBO
        </a>

        {/* Desktop Nav */}
        <ul className="hidden lg:flex items-center gap-10">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-[13px] tracking-[0.15em] text-ink-muted hover:text-ink transition-colors duration-200"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA Desktop */}
        <a
          href="https://wa.me/573202107769"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-2 bg-sage text-bg text-[13px] font-medium tracking-wider px-6 py-3 hover:bg-sage-dark transition-colors duration-200"
        >
          COTIZAR PROYECTO
          <ArrowRight size={14} strokeWidth={2} />
        </a>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-ink p-2 -mr-2"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 top-[70px] bg-bg z-40"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex flex-col h-full px-5 py-8">
            <ul className="flex flex-col gap-1">
              {links.map((link, i) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-4 text-3xl font-display tracking-wide text-ink hover:text-sage transition-colors border-b border-line"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <a
                href="https://wa.me/573202107769"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-sage text-bg text-sm font-medium tracking-wider py-4"
              >
                COTIZAR PROYECTO
                <ArrowRight size={16} />
              </a>

              <div className="flex items-center justify-between mt-8 text-ink-muted text-xs tracking-wider">
                <span>BOGOTA, CO</span>
                <span>@CRISBOTATTOO</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
