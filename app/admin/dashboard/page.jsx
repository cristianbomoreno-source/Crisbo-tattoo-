"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LogOut,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Users,
  Ticket,
  Clock,
  CheckCircle,
  DollarSign,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Eye,
} from "lucide-react";

export default function AdminDashboard() {
  const [reservations, setReservations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [processing, setProcessing] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (!auth) {
      router.push("/admin");
    }
  }, [router]);

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

      if (!response.ok) {
        console.error("Error en respuesta:", await response.text());
      }
      return response.ok;
    } catch (error) {
      console.error("Error:", error);
      return false;
    }
  };

  const handleMultipleActions = async (ticketIdMap, tickets, action) => {
    setProcessing(tickets[0]);
    try {
      for (const ticket of tickets) {
        const reservationId = ticketIdMap[ticket];
        await handleAction(reservationId, ticket, action);
      }
      fetchData();
    } finally {
      setProcessing(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    router.push("/admin");
  };

  // Agrupar reservaciones por comprador (mismo comprobante)
  const groupedReservations = reservations.reduce((acc, res) => {
    const key = res.payment_proof_url;
    if (!acc[key]) {
      acc[key] = {
        ...res,
        tickets: [res.ticket_number],
        ticketIdMap: { [res.ticket_number]: res.id },
        totalAmount: 30000,
      };
    } else {
      acc[key].tickets.push(res.ticket_number);
      acc[key].ticketIdMap[res.ticket_number] = res.id;
      acc[key].totalAmount += 30000;
    }
    return acc;
  }, {});

  const groupedList = Object.values(groupedReservations);

  // Estadísticas
  const stats = {
    total: tickets.length,
    available: tickets.filter((t) => t.status === "available").length,
    reserved: tickets.filter((t) => t.status === "reserved").length,
    sold: tickets.filter((t) => t.status === "sold").length,
  };

  const totalRecaudado = stats.sold * 30000;
  const totalPendiente = stats.reserved * 30000;

  const formatDate = (date) => {
    return new Date(date).toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openWhatsApp = (phone, name, tickets) => {
    const ticketStr = tickets.map(t => `#${t}`).join(', ');
    const message = encodeURIComponent(
      `Hola ${name}! Tu reserva de la rifa Crisbo Tattoo (boleta${tickets.length > 1 ? 's' : ''} ${ticketStr}) ha sido confirmada. Gracias por participar y buena suerte!`
    );
    window.open(`https://wa.me/57${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const openWhatsAppReject = (phone, name, tickets) => {
    const ticketStr = tickets.map(t => `#${t}`).join(', ');
    const message = encodeURIComponent(
      `Hola ${name}. Lamentamos informarte que no pudimos verificar el pago de tu reserva (boleta${tickets.length > 1 ? 's' : ''} ${ticketStr}) de la rifa Crisbo Tattoo. Por favor comunícate con nosotros si crees que es un error. Gracias.`
    );
    window.open(`https://wa.me/57${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-surface border-b border-line sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-48 h-32">
              <Image
                src="/images/logo-crisbo.png"
                alt="Crisbo Tattoo"
                fill
                className="object-contain brightness-0 invert"
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-gold text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                PANEL ADMIN
              </p>
              <p className="text-muted text-xs">Gestión de Rifa</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-muted hover:text-cream transition-colors px-3 py-2 rounded-lg hover:bg-surface-light"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard
            icon={<Ticket className="w-5 h-5" />}
            value={stats.available}
            label="Disponibles"
            color="cream"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            value={stats.reserved}
            label="Pendientes"
            color="orange"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            value={stats.sold}
            label="Vendidas"
            color="green"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            value={`$${(totalRecaudado / 1000).toFixed(0)}K`}
            label="Confirmado"
            color="gold"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            value={`$${(totalPendiente / 1000).toFixed(0)}K`}
            label="Pendiente"
            color="orange"
            className="col-span-2 lg:col-span-1"
          />
        </div>

        {/* Barra de progreso */}
        <div className="bg-surface rounded-2xl p-4 border border-line">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted text-sm">Progreso de venta</span>
            <span className="text-cream text-sm font-bold">
              {stats.sold + stats.reserved} / {stats.total}
            </span>
          </div>
          <div className="h-3 bg-bg rounded-full overflow-hidden flex">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${(stats.sold / stats.total) * 100}%` }}
            />
            <div
              className="bg-orange transition-all"
              style={{ width: `${(stats.reserved / stats.total) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-muted">Confirmadas</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange rounded-full" />
              <span className="text-muted">Pendientes</span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { key: "pending", label: "Pendientes", count: stats.reserved },
              { key: "approved", label: "Aprobados", count: stats.sold },
              { key: "rejected", label: "Rechazados" },
              { key: "all", label: "Todos" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  filter === f.key
                    ? "bg-gold text-bg"
                    : "bg-surface text-muted hover:text-cream border border-line"
                }`}
              >
                {f.label}
                {f.count !== undefined && filter !== f.key && (
                  <span className="bg-orange text-bg text-xs px-1.5 py-0.5 rounded-full">
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 text-muted hover:text-cream transition-colors px-3 py-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {/* Lista de reservaciones */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-3 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted mt-4">Cargando...</p>
            </div>
          ) : groupedList.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-2xl border border-line">
              <div className="w-16 h-16 bg-surface-light rounded-full mx-auto flex items-center justify-center mb-4">
                <Ticket className="w-8 h-8 text-muted" />
              </div>
              <p className="text-muted">
                No hay reservaciones {filter === "pending" ? "pendientes" : filter === "approved" ? "aprobadas" : filter === "rejected" ? "rechazadas" : ""}
              </p>
            </div>
          ) : (
            groupedList.map((res) => (
              <div
                key={res.id}
                className="bg-surface rounded-2xl border border-line overflow-hidden"
              >
                {/* Header de la tarjeta */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Info del cliente */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {res.tickets.map((t) => (
                          <span
                            key={t}
                            className="bg-gold text-bg px-3 py-1 rounded-full text-sm font-bold"
                            style={{ fontFamily: 'var(--font-headline)' }}
                          >
                            #{t}
                          </span>
                        ))}
                        <span className="text-gold font-bold ml-2">
                          ${res.totalAmount.toLocaleString('es-CO')}
                        </span>
                      </div>
                      <h3 className="text-cream font-bold text-lg">{res.buyer_name}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm">
                        <a
                          href={`tel:${res.buyer_whatsapp}`}
                          className="flex items-center gap-1 text-muted hover:text-cream"
                        >
                          <Phone className="w-4 h-4" />
                          {res.buyer_whatsapp}
                        </a>
                        {res.buyer_email && (
                          <a
                            href={`mailto:${res.buyer_email}`}
                            className="flex items-center gap-1 text-muted hover:text-cream"
                          >
                            <Mail className="w-4 h-4" />
                            {res.buyer_email}
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-2">
                        {formatDate(res.created_at)}
                      </p>
                    </div>

                    {/* Status badge */}
                    <div>
                      {res.status === "pending" && (
                        <span className="bg-orange/20 text-orange border border-orange/50 px-3 py-1 rounded-full text-xs font-bold">
                          PENDIENTE
                        </span>
                      )}
                      {res.status === "approved" && (
                        <span className="bg-green-500/20 text-green-400 border border-green-500/50 px-3 py-1 rounded-full text-xs font-bold">
                          APROBADO
                        </span>
                      )}
                      {res.status === "rejected" && (
                        <span className="bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-1 rounded-full text-xs font-bold">
                          RECHAZADO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botón expandir */}
                  <button
                    onClick={() => setExpandedCard(expandedCard === res.id ? null : res.id)}
                    className="w-full mt-4 flex items-center justify-center gap-2 text-muted hover:text-cream py-2 border-t border-line transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Ver comprobante</span>
                    {expandedCard === res.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Contenido expandible */}
                {expandedCard === res.id && (
                  <div className="border-t border-line p-4 bg-bg">
                    {/* Imagen del comprobante */}
                    <div className="bg-white rounded-xl p-2 mb-4">
                      <img
                        src={res.payment_proof_url}
                        alt="Comprobante de pago"
                        className="w-full max-h-96 object-contain rounded-lg"
                      />
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={res.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-surface text-cream py-3 px-4 rounded-xl hover:bg-surface-light transition-colors border border-line"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Abrir imagen
                      </a>

                      {res.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleMultipleActions(res.ticketIdMap, res.tickets, "approve")}
                            disabled={processing}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-500 transition-colors disabled:opacity-50"
                          >
                            <Check className="w-5 h-5" />
                            Aprobar
                          </button>
                          <button
                            onClick={async () => {
                              await handleMultipleActions(res.ticketIdMap, res.tickets, "reject");
                              openWhatsAppReject(res.buyer_whatsapp, res.buyer_name, res.tickets);
                            }}
                            disabled={processing}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50"
                          >
                            <X className="w-5 h-5" />
                            Rechazar
                          </button>
                        </>
                      )}

                      {res.status === "approved" && (
                        <>
                          <button
                            onClick={() => openWhatsApp(res.buyer_whatsapp, res.buyer_name, res.tickets)}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-500 transition-colors"
                          >
                            <MessageCircle className="w-5 h-5" />
                            WhatsApp
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('¿Seguro que deseas cancelar esta reservación? La boleta volverá a estar disponible.')) {
                                handleMultipleActions(res.ticketIdMap, res.tickets, "cancel");
                              }
                            }}
                            disabled={processing}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50"
                          >
                            <X className="w-5 h-5" />
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, value, label, color, className = "" }) {
  const colors = {
    cream: "text-cream bg-surface-light",
    orange: "text-orange bg-orange/20",
    green: "text-green-400 bg-green-500/20",
    gold: "text-gold bg-gold/20",
  };

  return (
    <div className={`bg-surface rounded-2xl p-4 border border-line ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className={`text-2xl font-bold ${color === 'gold' ? 'text-gold' : color === 'green' ? 'text-green-400' : color === 'orange' ? 'text-orange' : 'text-cream'}`} style={{ fontFamily: 'var(--font-headline)' }}>
            {value}
          </p>
          <p className="text-xs text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}
