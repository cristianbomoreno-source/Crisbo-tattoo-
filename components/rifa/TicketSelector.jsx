"use client";

import { useState, useEffect } from "react";
import { RefreshCw, X, ArrowRight, Loader2 } from "lucide-react";
import ReservationFlow from "./ReservationFlow";

export default function TicketSelector({ onClose }) {
  const [tickets, setTickets] = useState([]);
  const [randomTickets, setRandomTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showReservation, setShowReservation] = useState(false);

  // Cargar todos los tickets
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

  // Elegir 4 tickets aleatorios
  const pickRandomTickets = (availableTickets) => {
    const shuffled = [...availableTickets].sort(() => Math.random() - 0.5);
    setRandomTickets(shuffled.slice(0, 4));
  };

  // Refrescar boletas
  const handleRefresh = () => {
    setRefreshing(true);
    setSelectedTicket(null);
    setTimeout(() => {
      pickRandomTickets(tickets);
      setRefreshing(false);
    }, 300);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSelectTicket = (number) => {
    setSelectedTicket(number);
  };

  const handleContinue = () => {
    if (selectedTicket) {
      setShowReservation(true);
    }
  };

  const handleReservationSuccess = () => {
    setShowReservation(false);
    onClose();
  };

  if (showReservation && selectedTicket) {
    return (
      <ReservationFlow
        ticketNumber={selectedTicket}
        onClose={() => setShowReservation(false)}
        onSuccess={handleReservationSuccess}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-line">
        <button
          onClick={onClose}
          className="p-2 text-muted hover:text-cream transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h2
          className="text-cream text-lg tracking-wider"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          ESCOGE TU NÚMERO
        </h2>
        <div className="w-10" />
      </div>

      {/* Contenido */}
      <div className="flex flex-col h-[calc(100vh-70px)] p-4">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-orange animate-spin" />
          </div>
        ) : (
          <>
            {/* Tickets disponibles */}
            <div className="text-center mb-6">
              <p className="text-muted text-sm">
                {tickets.length} boletas disponibles
              </p>
            </div>

            {/* Grid de 4 boletas */}
            <div className={`grid grid-cols-2 gap-4 mb-6 ${refreshing ? 'opacity-50' : ''}`}>
              {randomTickets.map((ticket) => (
                <button
                  key={ticket.number}
                  onClick={() => handleSelectTicket(ticket.number)}
                  className={`
                    relative aspect-[4/3] rounded-2xl border-2 transition-all duration-200
                    flex flex-col items-center justify-center
                    ${selectedTicket === ticket.number
                      ? 'border-orange bg-orange/20 scale-[1.02]'
                      : 'border-line bg-surface hover:border-orange/50'
                    }
                  `}
                >
                  {/* Número grande */}
                  <span
                    className={`text-5xl font-bold ${selectedTicket === ticket.number ? 'text-orange' : 'text-cream'}`}
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    {ticket.number}
                  </span>

                  {/* Check si está seleccionado */}
                  {selectedTicket === ticket.number && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-orange rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-cream" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Botón refrescar */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 text-muted hover:text-cream py-3 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                VER OTROS NÚMEROS
              </span>
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Número seleccionado y botón continuar */}
            <div className="space-y-4 pb-4">
              {selectedTicket && (
                <div className="text-center animate-fade-up">
                  <p className="text-muted text-xs mb-1">Número seleccionado</p>
                  <p
                    className="text-orange text-4xl font-bold"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    #{selectedTicket}
                  </p>
                </div>
              )}

              <button
                onClick={handleContinue}
                disabled={!selectedTicket}
                className={`
                  w-full py-4 rounded-full font-bold text-lg tracking-wider
                  flex items-center justify-center gap-3 transition-all
                  ${selectedTicket
                    ? 'bg-orange text-cream active:scale-[0.98]'
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
