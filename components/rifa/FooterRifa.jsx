"use client";

import { Instagram, MessageCircle, MapPin } from "lucide-react";

export default function FooterRifa() {
  return (
    <footer className="py-12 px-mobile bg-bg border-t border-line">
      <div className="max-w-4xl mx-auto">
        {/* Logo/Nombre */}
        <div className="text-center mb-8">
          <h3 className="font-gothic text-poster-sm text-gold">CRISBO</h3>
          <p className="font-display text-cream text-lg">TATTOO</p>
        </div>

        {/* Links */}
        <div className="flex justify-center gap-6 mb-8">
          <a
            href="https://instagram.com/crisbotattoo"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-surface flex items-center justify-center hover:bg-gold hover:text-bg transition-colors group"
          >
            <Instagram className="w-5 h-5 text-muted group-hover:text-bg" />
          </a>
          <a
            href="https://wa.me/573202107769"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-surface flex items-center justify-center hover:bg-teal transition-colors group"
          >
            <MessageCircle className="w-5 h-5 text-muted group-hover:text-cream" />
          </a>
          <a
            href="https://share.google/qeywmW0E0sMJvThim"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-surface flex items-center justify-center hover:bg-surface-light transition-colors group"
          >
            <MapPin className="w-5 h-5 text-muted group-hover:text-cream" />
          </a>
        </div>

        {/* Info */}
        <div className="text-center text-muted text-xs space-y-2">
          <p>Cl. 137b #57b - 39, piso 2 - Bogota, Colombia</p>
          <p>Lunes a Sabado, 10:00 a.m. - 7:00 p.m.</p>
          <p className="pt-4 text-cement">
            2026 Crisbo Tattoo. Todos los derechos reservados.
          </p>
        </div>

        {/* Sello decorativo */}
        <div className="flex justify-center mt-8">
          <div className="stamp stamp-gold opacity-50 rotate-[-5deg]">
            HECHO CON TINTA
          </div>
        </div>
      </div>
    </footer>
  );
}
