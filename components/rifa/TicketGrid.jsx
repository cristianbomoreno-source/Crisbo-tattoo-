"use client";

import { useState, useEffect } from "react";

export default function TicketGrid({ tickets, onSelectTicket, selectedTicket }) {
  // Estados: available, reserved, sold
  const getTicketStyle = (status, isSelected) => {
    const base = "w-full aspect-square flex items-center justify-center font-display text-sm sm:text-base transition-all duration-200 border-2";

    if (isSelected) {
      return `${base} bg-gold text-bg border-gold scale-105 shadow-hard-gold`;
    }

    switch (status) {
      case "available":
        return `${base} bg-surface hover:bg-surface-light border-line hover:border-gold/50 text-cream cursor-pointer hover:scale-105`;
      case "reserved":
        return `${base} bg-teal-muted border-teal/30 text-teal cursor-not-allowed`;
      case "sold":
        return `${base} bg-gold-muted border-gold/30 text-gold/70 cursor-not-allowed`;
      default:
        return `${base} bg-surface border-line text-muted`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "reserved":
        return (
          <svg className="w-3 h-3 absolute top-1 right-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
          </svg>
        );
      case "sold":
        return (
          <svg className="w-3 h-3 absolute top-1 right-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Contadores
  const counts = {
    available: tickets.filter((t) => t.status === "available").length,
    reserved: tickets.filter((t) => t.status === "reserved").length,
    sold: tickets.filter((t) => t.status === "sold").length,
  };

  return (
    <div className="space-y-6">
      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-surface border-2 border-line" />
          <span className="text-sm text-muted">Disponible ({counts.available})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-teal-muted border-2 border-teal/30" />
          <span className="text-sm text-teal">Reservado ({counts.reserved})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gold-muted border-2 border-gold/30" />
          <span className="text-sm text-gold">Vendido ({counts.sold})</span>
        </div>
      </div>

      {/* Grid de tickets */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 sm:gap-2 max-w-4xl mx-auto">
        {tickets.map((ticket) => (
          <button
            key={ticket.number}
            onClick={() => ticket.status === "available" && onSelectTicket(ticket.number)}
            disabled={ticket.status !== "available"}
            className={`relative ${getTicketStyle(ticket.status, selectedTicket === ticket.number)}`}
          >
            {ticket.number}
            {getStatusIcon(ticket.status)}
          </button>
        ))}
      </div>

      {/* Número seleccionado */}
      {selectedTicket && (
        <div className="text-center animate-fade-up">
          <p className="text-muted text-sm mb-1">Numero seleccionado:</p>
          <span className="sticker text-xl px-6 py-2"># {selectedTicket}</span>
        </div>
      )}
    </div>
  );
}
