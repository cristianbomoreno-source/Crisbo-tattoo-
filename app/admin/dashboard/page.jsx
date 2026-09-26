"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Filter,
  Users,
  Ticket,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function AdminDashboard() {
  const [reservations, setReservations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [processing, setProcessing] = useState(null);
  const router = useRouter();

  // Verificar autenticación
  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (!auth) {
      router.push("/admin");
    }
  }, [router]);

  // Cargar datos
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resResponse, ticketsResponse] = await Promise.all([
        fetch(`/api/admin/reservations?status=${filter}`),
        fetch("/api/tickets"),
      ]);

      const resData = await resResponse.json();
      const ticketsData = await ticketsResponse.json();

      setReservations(resData.reservations || []);
      setTickets(ticketsData.tickets || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleAction = async (reservationId, ticketNumber, action) => {
    setProcessing(reservationId);
    try {
      const response = await fetch("/api/admin/reservations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          ticketNumber,
          action,
        }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    router.push("/admin");
  };

  // Estadísticas
  const stats = {
    total: tickets.length,
    available: tickets.filter((t) => t.status === "available").length,
    reserved: tickets.filter((t) => t.status === "reserved").length,
    sold: tickets.filter((t) => t.status === "sold").length,
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-surface border-b border-line sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-gothic text-2xl text-gold">ADMIN</h1>
            <p className="text-muted text-xs">Panel de Rifa</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-ghost flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-editorial p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-light flex items-center justify-center">
                <Ticket className="w-5 h-5 text-cream" />
              </div>
              <div>
                <p className="text-2xl font-display text-cream">{stats.available}</p>
                <p className="text-xs text-muted">Disponibles</p>
              </div>
            </div>
          </div>

          <div className="card-editorial p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-muted flex items-center justify-center">
                <Clock className="w-5 h-5 text-teal" />
              </div>
              <div>
                <p className="text-2xl font-display text-teal">{stats.reserved}</p>
                <p className="text-xs text-muted">Reservados</p>
              </div>
            </div>
          </div>

          <div className="card-editorial p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold-muted flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-display text-gold">{stats.sold}</p>
                <p className="text-xs text-muted">Vendidos</p>
              </div>
            </div>
          </div>

          <div className="card-editorial p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-light flex items-center justify-center">
                <Users className="w-5 h-5 text-cream" />
              </div>
              <div>
                <p className="text-2xl font-display text-cream">
                  ${((stats.sold + stats.reserved) * 30000).toLocaleString()}
                </p>
                <p className="text-xs text-muted">Recaudado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y Refresh */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted" />
            {["pending", "approved", "rejected", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm font-display ${
                  filter === f
                    ? "bg-gold text-bg"
                    : "bg-surface text-muted hover:text-cream"
                }`}
              >
                {f === "pending" && "Pendientes"}
                {f === "approved" && "Aprobados"}
                {f === "rejected" && "Rechazados"}
                {f === "all" && "Todos"}
              </button>
            ))}
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        {/* Lista de reservaciones */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted mt-4">Cargando...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-12 card-editorial">
              <p className="text-muted">No hay reservaciones {filter !== "all" && filter}</p>
            </div>
          ) : (
            reservations.map((res) => (
              <div key={res.id} className="card-editorial p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Info */}
                  <div className="flex items-start gap-4">
                    <div className="sticker text-lg px-4">#{res.ticket_number}</div>
                    <div>
                      <h3 className="font-display text-cream">{res.buyer_name}</h3>
                      <p className="text-sm text-muted">{res.buyer_whatsapp}</p>
                      {res.buyer_email && (
                        <p className="text-xs text-cement">{res.buyer_email}</p>
                      )}
                      <p className="text-xs text-cement mt-1">
                        {formatDate(res.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    {/* Ver comprobante */}
                    <a
                      href={res.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary py-2 px-3 text-xs"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver pago
                    </a>

                    {res.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAction(res.id, res.ticket_number, "approve")}
                          disabled={processing === res.id}
                          className="btn-teal py-2 px-3 text-xs disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleAction(res.id, res.ticket_number, "reject")}
                          disabled={processing === res.id}
                          className="bg-red-500/20 text-red-400 border border-red-500/50 py-2 px-3 text-xs hover:bg-red-500/30"
                        >
                          <X className="w-4 h-4" />
                          Rechazar
                        </button>
                      </>
                    )}

                    {res.status === "approved" && (
                      <span className="stamp stamp-gold text-xs">APROBADO</span>
                    )}

                    {res.status === "rejected" && (
                      <span className="text-red-400 text-xs border border-red-400/50 px-2 py-1">
                        RECHAZADO
                      </span>
                    )}
                  </div>
                </div>

                {res.admin_notes && (
                  <p className="mt-3 text-xs text-cement border-t border-line pt-3">
                    Nota: {res.admin_notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
