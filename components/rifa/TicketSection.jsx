"use client";

import { useState, useEffect } from "react";
import TicketGrid from "./TicketGrid";
import ReservationModal from "./ReservationModal";
import { Check, PartyPopper } from "lucide-react";

export default function TicketSection() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Cargar tickets
  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/tickets");
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error("Error cargando tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // Refrescar cada 30 segundos para ver actualizaciones
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectTicket = (number) => {
    setSelectedTicket(number);
    setShowModal(true);
  };

  const handleSuccess = (result) => {
    setShowModal(false);
    setSelectedTicket(null);
    setSuccessMessage({
      ticketNumber: result.reservation.ticket_number,
      name: result.reservation.buyer_name,
    });
    // Refrescar tickets
    fetchTickets();
    // Ocultar mensaje después de 10 segundos
    setTimeout(() => setSuccessMessage(null), 10000);
  };

  return (
    <section id="boletas" className="py-20 px-mobile relative">
      <div className="max-w-5xl mx-auto">
        {/* Título de sección */}
        <div className="text-center mb-12">
          <span className="label text-xs">02 / BOLETAS</span>
          <h2 className="font-gothic text-poster-md text-gold mt-2">
            ESCOGE TU NUMERO
          </h2>
          <p className="text-muted mt-4 max-w-md mx-auto">
            Solo hay 200 cupos disponibles. Escoge tu numero de la suerte y asegura tu participacion.
          </p>
        </div>

        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="mb-8 animate-fade-up">
            <div className="torn-paper bg-teal text-cream p-6 text-center max-w-md mx-auto">
              <PartyPopper className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-display text-xl mb-2">RESERVA EXITOSA!</h3>
              <p className="text-sm opacity-90">
                {successMessage.name}, tu boleta <strong>#{successMessage.ticketNumber}</strong> ha sido reservada.
              </p>
              <p className="text-xs mt-3 opacity-70">
                Te contactaremos por WhatsApp para confirmar tu pago.
              </p>
            </div>
          </div>
        )}

        {/* Grid de tickets */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <p className="text-muted mt-4">Cargando boletas...</p>
          </div>
        ) : (
          <TicketGrid
            tickets={tickets}
            onSelectTicket={handleSelectTicket}
            selectedTicket={selectedTicket}
          />
        )}

        {/* Info adicional */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3 text-center">
          <div className="p-4">
            <div className="stamp stamp-gold mx-auto mb-2 w-fit">PASO 1</div>
            <p className="text-sm text-muted">Escoge tu numero</p>
          </div>
          <div className="p-4">
            <div className="stamp stamp-gold mx-auto mb-2 w-fit">PASO 2</div>
            <p className="text-sm text-muted">Paga por Nequi</p>
          </div>
          <div className="p-4">
            <div className="stamp stamp-gold mx-auto mb-2 w-fit">PASO 3</div>
            <p className="text-sm text-muted">Sube tu comprobante</p>
          </div>
        </div>
      </div>

      {/* Modal de reservación */}
      {showModal && selectedTicket && (
        <ReservationModal
          ticketNumber={selectedTicket}
          onClose={() => {
            setShowModal(false);
            setSelectedTicket(null);
          }}
          onSuccess={handleSuccess}
        />
      )}
    </section>
  );
}
