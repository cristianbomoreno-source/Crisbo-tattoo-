"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { RefreshCw, X, ArrowRight, Loader2 } from "lucide-react";
import ReservationFlow from "./ReservationFlow";

export default function TicketSelector({ onClose }) {
  const [tickets, setTickets] = useState([]);
  const [randomTickets, setRandomTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [showReservation, setShowReservation] = useState(false);

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/tickets");
      const data = await response.json();
      const available = (data.tickets || []).filter(t => t.status === "available");
      setTickets(available);
      pickRandomTickets(available);
    } catch (error) {
      console.error("Error cargando tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const pickRandomTickets = (availableTickets) => {
    const shuffled = [...availableTickets].sort(() => Math.random() - 0.5);
    setRandomTickets(shuffled.slice(0, Math.min(4, shuffled.length)));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      pickRandomTickets(tickets);
      setRefreshing(false);
    }, 300);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSelectTicket = (number) => {
    setSelectedTickets(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        return [...prev, number].sort((a, b) => Number(a) - Number(b));
      }
    });
  };

  const handleContinue = () => {
    if (selectedTickets.length > 0) {
      setShowReservation(true);
    }
  };

  const handleReservationSuccess = () => {
    setShowReservation(false);
    onClose();
  };

  if (showReservation && selectedTickets.length > 0) {
    return (
      <ReservationFlow
        ticketNumbers={selectedTickets}
        onClose={() => setShowReservation(false)}
        onSuccess={handleReservationSuccess}
      />
    );
  }

  const getGridClass = () => {
    const count = randomTickets.length;
    if (count === 1) return 'grid-cols-1 max-w-[180px] mx-auto';
    if (count === 2) return 'grid-cols-2 max-w-[380px] mx-auto';
    if (count === 3) return 'grid-cols-2 max-w-[380px] mx-auto';
    return 'grid-cols-2';
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg overflow-y-auto">
      {/* Header con logo */}
      <div className="sticky top-0 bg-bg/95 backdrop-blur-sm z-10 border-b border-line">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-muted hover:text-cream transition-colors rounded-full hover:bg-surface"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Logo */}
          <div className="relative w-24 h-16">
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
      <div className="flex flex-col min-h-[calc(100vh-80px)] p-5">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-orange animate-spin" />
          </div>
        ) : randomTickets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">😢</span>
            </div>
            <p className="text-cream text-2xl mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
              ¡BOLETAS AGOTADAS!
            </p>
            <p className="text-muted text-sm">
              Todas las boletas han sido vendidas. Síguenos en Instagram para futuras rifas.
            </p>
          </div>
        ) : (
          <>
            {/* Título y descripción */}
            <div className="text-center mb-8">
              <h1
                className="text-cream text-3xl mb-2"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                ESCOGE TU NÚMERO
              </h1>
              <p className="text-muted text-sm">
                Toca el número que quieres para tu boleta
              </p>
            </div>

            {/* Grid de boletas */}
            <div className={`grid ${getGridClass()} gap-4 mb-6 ${refreshing ? 'opacity-50' : ''}`}>
              {randomTickets.map((ticket) => {
                const isSelected = selectedTickets.includes(ticket.number);
                return (
                  <button
                    key={ticket.number}
                    onClick={() => handleSelectTicket(ticket.number)}
                    className={`
                      relative aspect-square rounded-3xl border-3 transition-all duration-300
                      flex flex-col items-center justify-center
                      ${isSelected
                        ? 'border-orange bg-orange text-bg scale-105 shadow-lg shadow-orange/30'
                        : 'border-line bg-surface hover:border-orange/50 hover:bg-surface-light'
                      }
                    `}
                  >
                    <span
                      className={`text-6xl font-bold ${isSelected ? 'text-bg' : 'text-cream'}`}
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
                      {ticket.number}
                    </span>

                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Botón refrescar */}
            {tickets.length > 4 && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center justify-center gap-2 text-orange hover:text-orange-light py-4 transition-colors disabled:opacity-50 mx-auto"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-semibold tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                  VER OTROS NÚMEROS
                </span>
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1 min-h-8" />

            {/* Footer con selección y botón */}
            <div className="space-y-4 pb-4">
              {selectedTickets.length > 0 ? (
                <div className="bg-surface rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-muted text-xs">
                      {selectedTickets.length === 1 ? 'Tu número seleccionado' : `${selectedTickets.length} números seleccionados`}
                    </p>
                    <p className="text-gold text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                      ${(selectedTickets.length * 30000).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {selectedTickets.map(num => (
                      <span
                        key={num}
                        className="bg-orange text-bg px-3 py-1 rounded-full text-lg font-bold"
                        style={{ fontFamily: 'var(--font-headline)' }}
                      >
                        #{num}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-surface/50 rounded-2xl p-4 text-center border border-dashed border-line">
                  <p className="text-muted text-sm">
                    👆 Toca los números que quieras seleccionar
                  </p>
                </div>
              )}

              <button
                onClick={handleContinue}
                disabled={selectedTickets.length === 0}
                className={`
                  w-full py-5 rounded-full font-bold text-lg tracking-wider
                  flex items-center justify-center gap-3 transition-all
                  ${selectedTickets.length > 0
                    ? 'bg-orange text-cream active:scale-[0.98] shadow-lg shadow-orange/30'
                    : 'bg-surface text-muted cursor-not-allowed'
                  }
                `}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                CONTINUAR
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
