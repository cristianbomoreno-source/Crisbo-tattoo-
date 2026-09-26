"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { RefreshCw, X, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import ReservationFlow from "./ReservationFlow";

export default function TicketSelector({
  onClose,
  requiredTickets = 1,
  pricePerTicket = 30000,
  totalPrice = 30000,
  packageName = "BÁSICO"
}) {
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
      // Mostrar más números si necesita seleccionar más boletas
      const numToShow = Math.max(4, requiredTickets + 2);
      pickRandomTickets(available, numToShow);
    } catch (error) {
      console.error("Error cargando tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const pickRandomTickets = (availableTickets, count = 4) => {
    // Mantener los tickets ya seleccionados y agregar nuevos
    const selectedSet = new Set(selectedTickets);
    const notSelected = availableTickets.filter(t => !selectedSet.has(t.number));
    const shuffled = [...notSelected].sort(() => Math.random() - 0.5);

    // Combinar seleccionados con nuevos aleatorios
    const selectedTicketObjs = availableTickets.filter(t => selectedSet.has(t.number));
    const newTickets = shuffled.slice(0, Math.max(count - selectedTicketObjs.length, 0));

    setRandomTickets([...selectedTicketObjs, ...newTickets].slice(0, Math.max(count, requiredTickets + 2)));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      const numToShow = Math.max(4, requiredTickets + 2);
      pickRandomTickets(tickets, numToShow);
      setRefreshing(false);
    }, 300);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSelectTicket = (number) => {
    setSelectedTickets(prev => {
      if (prev.includes(number)) {
        // Deseleccionar
        return prev.filter(n => n !== number);
      } else {
        // Solo permitir seleccionar hasta el número requerido
        if (prev.length >= requiredTickets) {
          // Reemplazar el primero seleccionado
          return [...prev.slice(1), number].sort((a, b) => Number(a) - Number(b));
        }
        return [...prev, number].sort((a, b) => Number(a) - Number(b));
      }
    });
  };

  const handleContinue = () => {
    if (selectedTickets.length === requiredTickets) {
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
        totalPrice={totalPrice}
        onClose={() => setShowReservation(false)}
        onSuccess={handleReservationSuccess}
      />
    );
  }

  const getGridClass = () => {
    const count = randomTickets.length;
    if (count <= 2) return 'grid-cols-2 max-w-[380px] mx-auto';
    if (count <= 4) return 'grid-cols-2';
    return 'grid-cols-3';
  };

  const remainingToSelect = requiredTickets - selectedTickets.length;

  return (
    <div className="fixed inset-0 z-50 bg-bg overflow-y-auto">
      {/* Header con logo */}
      <div className="sticky top-0 bg-bg/95 backdrop-blur-sm z-10 border-b border-line">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-muted hover:text-cream transition-colors rounded-full hover:bg-surface"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Logo */}
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

      {/* Info del paquete */}
      <div className="mx-4 mt-4 bg-surface rounded-2xl p-3 flex items-center justify-between">
        <div>
          <p className="text-muted text-xs">Paquete {packageName}</p>
          <p className="text-cream text-sm">
            {requiredTickets} boleta{requiredTickets > 1 ? 's' : ''} × ${pricePerTicket.toLocaleString('es-CO')}
          </p>
        </div>
        <p className="text-gold text-xl font-bold" style={{ fontFamily: 'var(--font-headline)' }}>
          ${totalPrice.toLocaleString('es-CO')}
        </p>
      </div>

      {/* Contenido */}
      <div className="flex flex-col min-h-[calc(100vh-200px)] p-5">
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
            <div className="text-center mb-6">
              <h1
                className="text-cream text-2xl mb-2"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {requiredTickets === 1 ? 'ESCOGE TU NÚMERO' : `ESCOGE ${requiredTickets} NÚMEROS`}
              </h1>
              {remainingToSelect > 0 ? (
                <p className="text-orange text-sm font-medium">
                  Te falta{remainingToSelect > 1 ? 'n' : ''} {remainingToSelect} número{remainingToSelect > 1 ? 's' : ''}
                </p>
              ) : (
                <p className="text-green-400 text-sm font-medium">
                  ¡Listo! Ya seleccionaste tus {requiredTickets} números
                </p>
              )}
            </div>

            {/* Grid de boletas */}
            <div className={`grid ${getGridClass()} gap-3 mb-6 ${refreshing ? 'opacity-50' : ''}`}>
              {randomTickets.map((ticket) => {
                const isSelected = selectedTickets.includes(ticket.number);
                const selectionIndex = selectedTickets.indexOf(ticket.number) + 1;
                return (
                  <button
                    key={ticket.number}
                    onClick={() => handleSelectTicket(ticket.number)}
                    className={`
                      relative aspect-square rounded-2xl border-3 transition-all duration-300
                      flex flex-col items-center justify-center
                      ${isSelected
                        ? 'border-orange bg-orange text-bg scale-105 shadow-lg shadow-orange/30'
                        : 'border-line bg-surface hover:border-orange/50 hover:bg-surface-light'
                      }
                    `}
                  >
                    <span
                      className={`text-4xl font-bold ${isSelected ? 'text-bg' : 'text-cream'}`}
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
                      {ticket.number}
                    </span>

                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg text-white text-sm font-bold">
                        {selectionIndex}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Botón refrescar */}
            {tickets.length > randomTickets.length && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center justify-center gap-2 text-orange hover:text-orange-light py-3 transition-colors disabled:opacity-50 mx-auto"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-semibold tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                  VER OTROS NÚMEROS
                </span>
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1 min-h-4" />

            {/* Footer con selección y botón */}
            <div className="space-y-4 pb-4">
              {selectedTickets.length > 0 ? (
                <div className="bg-surface rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-muted text-xs">
                      {selectedTickets.length} de {requiredTickets} seleccionado{selectedTickets.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-gold text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                      ${totalPrice.toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {selectedTickets.map((num, i) => (
                      <span
                        key={num}
                        className="bg-orange text-bg px-3 py-1 rounded-full text-lg font-bold"
                        style={{ fontFamily: 'var(--font-headline)' }}
                      >
                        #{num}
                      </span>
                    ))}
                    {/* Mostrar espacios vacíos para los que faltan */}
                    {Array.from({ length: remainingToSelect }).map((_, i) => (
                      <span
                        key={`empty-${i}`}
                        className="border-2 border-dashed border-muted px-3 py-1 rounded-full text-lg font-bold text-muted"
                      >
                        #?
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-surface/50 rounded-2xl p-4 text-center border border-dashed border-line">
                  <p className="text-muted text-sm">
                    👆 Selecciona {requiredTickets} número{requiredTickets > 1 ? 's' : ''} para continuar
                  </p>
                </div>
              )}

              <button
                onClick={handleContinue}
                disabled={selectedTickets.length !== requiredTickets}
                className={`
                  w-full py-5 rounded-full font-bold text-lg tracking-wider
                  flex items-center justify-center gap-3 transition-all
                  ${selectedTickets.length === requiredTickets
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
