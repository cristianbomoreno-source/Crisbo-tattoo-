"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Menu, X } from "lucide-react";
import Image from "next/image";

const links = [
  { label: "Inicio", href: "#inicio" },
  { label: "Sobre mí", href: "#sobre-mi" },
  { label: "Trabajos", href: "#trabajos" },
  { label: "Proceso", href: "#proceso" },
  { label: "Testimonios", href: "#testimonios" },
  { label: "FAQ", href: "#faq" },
  { label: "Contacto", href: "#contacto" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-bg/85 backdrop-blur-md border-b border-line/60 py-3"
          : "bg-transparent border-b border-transparent py-6"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between">
        <a href="#inicio" className="flex items-center">
          <Image
            src="/images/logo-white.png"
            alt="Crisbo Tattoo Studio"
            width={160}
            height={192}
            className="h-11 w-auto"
            priority
          />
        </a>

        <ul className="hidden lg:flex items-center gap-9 text-[13px] tracking-[0.15em] uppercase text-ink/70">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="relative hover:text-ink transition-colors duration-300 group"
              >
                {link.label}
                <span className="absolute -bottom-1.5 left-0 w-0 h-[1.5px] bg-gold-2 group-hover:w-full transition-all duration-300" />
              </a>
            </li>
          ))}
        </ul>

        <a
          href="https://wa.me/573202107769"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-2 bg-gold-2 text-bg font-semibold text-[13px] tracking-wider uppercase px-5 py-3 rounded-sm hover:-translate-y-0.5 hover:shadow-gold-glow transition-all duration-300"
        >
          <MessageCircle size={16} strokeWidth={2.4} />
          WhatsApp
        </a>

        <button
          className="lg:hidden text-ink"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menú"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="lg:hidden bg-bg border-t border-line/60 mt-4"
        >
          <ul className="flex flex-col gap-1 px-6 py-4 text-sm uppercase tracking-wider">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-ink/80 hover:text-gold-2 transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <a
              href="https://wa.me/573202107769"
              className="mt-2 inline-flex items-center justify-center gap-2 bg-gold-2 text-bg font-semibold text-sm uppercase px-5 py-3 rounded-sm"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          </ul>
        </motion.div>
      )}
    </header>
  );
}
