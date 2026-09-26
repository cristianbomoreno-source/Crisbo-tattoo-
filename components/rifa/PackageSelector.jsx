"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Ticket, Star, Crown, ArrowRight, Check } from "lucide-react";
import TicketSelector from "./TicketSelector";

const packages = [
  {
    id: 1,
    name: "BÁSICO",
    tickets: 1,
    price: 30000,
    pricePerTicket: 30000,
    icon: Ticket,
    color: "orange",
    description: "Perfecto para probar suerte",
    features: ["1 oportunidad de ganar", "Precio estándar"],
  },
  {
    id: 2,
    name: "DÚO",
    tickets: 2,
    price: 50000,
    pricePerTicket: 25000,
    savings: 10000,
    icon: Star,
    color: "gold",
    popular: true,
    description: "El favorito de nuestros clientes",
    features: ["2 oportunidades de ganar", "Ahorras $10.000", "$25.000 por boleta"],
  },
  {
    id: 3,
    name: "MEGA",
    tickets: 3,
    price: 60000,
    pricePerTicket: 20000,
    savings: 30000,
    icon: Crown,
    color: "green",
    description: "Máximas oportunidades de ganar",
    features: ["3+ oportunidades", "Solo $20.000 c/u", "Mejor precio por boleta"],
    isCustom: true,
  },
];

export default function PackageSelector({ onClose }) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showTicketSelector, setShowTicketSelector] = useState(false);
  const [customTickets, setCustomTickets] = useState(3);

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handleContinue = () => {
    if (selectedPackage) {
      setShowTicketSelector(true);
    }
  };

  const getTicketCount = () => {
    if (!selectedPackage) return 0;
    if (selectedPackage.isCustom) return customTickets;
    return selectedPackage.tickets;
  };

  const getTotalPrice = () => {
    if (!selectedPackage) return 0;
    if (selectedPackage.isCustom) return customTickets * 20000;
    return selectedPackage.price;
  };

  if (showTicketSelector) {
    return (
      <TicketSelector
        onClose={onClose}
        requiredTickets={getTicketCount()}
        pricePerTicket={selectedPackage.isCustom ? 20000 : selectedPackage.pricePerTicket}
        totalPrice={getTotalPrice()}
        packageName={selectedPackage.name}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-bg overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-bg/95 backdrop-blur-sm z-10 border-b border-line">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-muted hover:text-cream transition-colors rounded-full hover:bg-surface"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative w-48 h-32">
            <Image
              src="/images/logo-crisbo.png"
              alt="Crisbo Tattoo"
              fill
              className="object-contain brightness-0 invert"
            />
          </div>

          <div className="w-10" />
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5">
        <div className="text-center mb-6">
          <h1
            className="text-cream text-3xl mb-2"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            ELIGE TU PAQUETE
          </h1>
          <p className="text-muted text-sm">
            Más boletas = Más oportunidades de ganar
          </p>
        </div>

        {/* Paquetes */}
        <div className="space-y-4 mb-6">
          {packages.map((pkg) => {
            const Icon = pkg.icon;
            const isSelected = selectedPackage?.id === pkg.id;

            return (
              <button
                key={pkg.id}
                onClick={() => handleSelectPackage(pkg)}
                className={`w-full text-left rounded-3xl p-5 transition-all border-3 ${
                  isSelected
                    ? pkg.color === 'gold'
                      ? 'border-gold bg-gold/10'
                      : pkg.color === 'green'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-orange bg-orange/10'
                    : 'border-line bg-surface hover:border-muted'
                } ${pkg.popular ? 'relative' : ''}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-bg text-xs font-bold px-4 py-1 rounded-full">
                    MÁS POPULAR
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    pkg.color === 'gold'
                      ? 'bg-gold/20'
                      : pkg.color === 'green'
                      ? 'bg-green-500/20'
                      : 'bg-orange/20'
                  }`}>
                    <Icon className={`w-7 h-7 ${
                      pkg.color === 'gold'
                        ? 'text-gold'
                        : pkg.color === 'green'
                        ? 'text-green-400'
                        : 'text-orange'
                    }`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-cream text-xl font-bold" style={{ fontFamily: 'var(--font-headline)' }}>
                        {pkg.name}
                      </h3>
                      {isSelected && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          pkg.color === 'gold'
                            ? 'bg-gold'
                            : pkg.color === 'green'
                            ? 'bg-green-500'
                            : 'bg-orange'
                        }`}>
                          <Check className="w-4 h-4 text-bg" />
                        </div>
                      )}
                    </div>

                    <p className="text-muted text-sm mb-3">{pkg.description}</p>

                    <div className="flex items-end justify-between">
                      <div>
                        {pkg.isCustom ? (
                          <p className={`text-2xl font-bold ${
                            pkg.color === 'green' ? 'text-green-400' : 'text-cream'
                          }`} style={{ fontFamily: 'var(--font-headline)' }}>
                            $20.000<span className="text-base text-muted font-normal"> c/u</span>
                          </p>
                        ) : (
                          <p className={`text-2xl font-bold ${
                            pkg.color === 'gold' ? 'text-gold' : 'text-cream'
                          }`} style={{ fontFamily: 'var(--font-headline)' }}>
                            ${pkg.price.toLocaleString('es-CO')}
                          </p>
                        )}
                        {pkg.savings && (
                          <p className="text-green-400 text-xs font-medium">
                            Ahorras ${pkg.savings.toLocaleString('es-CO')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-cream text-sm">
                          {pkg.isCustom ? '3+ boletas' : `${pkg.tickets} boleta${pkg.tickets > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-4 pt-4 border-t border-line/50">
                  <div className="flex flex-wrap gap-2">
                    {pkg.features.map((feature, i) => (
                      <span
                        key={i}
                        className={`text-xs px-3 py-1 rounded-full ${
                          pkg.color === 'gold'
                            ? 'bg-gold/20 text-gold'
                            : pkg.color === 'green'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-orange/20 text-orange'
                        }`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selector de cantidad para paquete MEGA */}
        {selectedPackage?.isCustom && (
          <div className="bg-surface rounded-2xl p-4 mb-6 border border-green-500/30">
            <p className="text-cream text-sm mb-3 text-center">¿Cuántas boletas quieres?</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setCustomTickets(Math.max(3, customTickets - 1))}
                className="w-12 h-12 rounded-full bg-surface-light text-cream text-2xl font-bold hover:bg-line transition-colors"
              >
                -
              </button>
              <div className="text-center">
                <p className="text-green-400 text-4xl font-bold" style={{ fontFamily: 'var(--font-headline)' }}>
                  {customTickets}
                </p>
                <p className="text-muted text-xs">boletas</p>
              </div>
              <button
                onClick={() => setCustomTickets(Math.min(10, customTickets + 1))}
                className="w-12 h-12 rounded-full bg-surface-light text-cream text-2xl font-bold hover:bg-line transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-center text-green-400 font-bold mt-3" style={{ fontFamily: 'var(--font-headline)' }}>
              Total: ${(customTickets * 20000).toLocaleString('es-CO')}
            </p>
          </div>
        )}

        {/* Resumen y botón */}
        {selectedPackage && (
          <div className="bg-surface rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-xs">Tu selección</p>
                <p className="text-cream font-bold">
                  Paquete {selectedPackage.name} - {getTicketCount()} boleta{getTicketCount() > 1 ? 's' : ''}
                </p>
              </div>
              <p className="text-gold text-2xl font-bold" style={{ fontFamily: 'var(--font-headline)' }}>
                ${getTotalPrice().toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={!selectedPackage}
          className={`w-full py-5 rounded-full font-bold text-lg tracking-wider flex items-center justify-center gap-3 transition-all ${
            selectedPackage
              ? 'bg-orange text-cream active:scale-[0.98] shadow-lg shadow-orange/30'
              : 'bg-surface text-muted cursor-not-allowed'
          }`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          ELEGIR MIS NÚMEROS
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
