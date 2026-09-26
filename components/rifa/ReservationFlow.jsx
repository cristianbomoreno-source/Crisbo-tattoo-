"use client";

import { useState } from "react";
import { X, Upload, Check, Loader2, ArrowLeft, ArrowRight, Copy } from "lucide-react";

export default function ReservationFlow({ ticketNumber, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    email: "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Solo se permiten imágenes");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("La imagen debe ser menor a 5MB");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError("");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.whatsapp) {
      setError("Nombre y WhatsApp son obligatorios");
      return;
    }
    if (!file) {
      setError("Debes subir el comprobante de pago");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const submitData = new FormData();
      submitData.append("ticketNumber", ticketNumber);
      submitData.append("name", formData.name);
      submitData.append("whatsapp", formData.whatsapp);
      submitData.append("email", formData.email);
      submitData.append("paymentProof", file);

      const response = await fetch("/api/reserve", {
        method: "POST",
        body: submitData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al crear la reserva");
      }

      setStep(4); // Éxito
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-line">
        <button
          onClick={step === 1 ? onClose : () => setStep(step - 1)}
          className="p-2 text-muted hover:text-cream transition-colors"
        >
          {step === 1 ? <X className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
        </button>
        <div className="text-center">
          <p className="text-muted text-xs">BOLETA</p>
          <p
            className="text-orange text-2xl font-bold"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            #{ticketNumber}
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Progress */}
      <div className="flex gap-1 px-4 py-3">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full transition-colors ${
              step >= s ? 'bg-orange' : 'bg-surface-light'
            }`}
          />
        ))}
      </div>

      {/* Contenido */}
      <div className="flex flex-col h-[calc(100vh-120px)] p-4">
        {/* Step 1: Datos */}
        {step === 1 && (
          <>
            <div className="mb-6">
              <h3
                className="text-cream text-2xl mb-1"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                TUS DATOS
              </h3>
              <p className="text-muted text-sm">
                Ingresa tus datos para la reserva
              </p>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="text-cream/70 text-xs tracking-wider block mb-2">
                  NOMBRE COMPLETO *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-4 text-cream placeholder:text-muted focus:border-orange focus:outline-none transition-colors"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="text-cream/70 text-xs tracking-wider block mb-2">
                  WHATSAPP *
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-4 text-cream placeholder:text-muted focus:border-orange focus:outline-none transition-colors"
                  placeholder="3XX XXX XXXX"
                />
              </div>

              <div>
                <label className="text-cream/70 text-xs tracking-wider block mb-2">
                  EMAIL (OPCIONAL)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-4 text-cream placeholder:text-muted focus:border-orange focus:outline-none transition-colors"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm text-center mb-4">
                {error}
              </div>
            )}

            <button
              onClick={() => {
                if (!formData.name || !formData.whatsapp) {
                  setError("Nombre y WhatsApp son obligatorios");
                  return;
                }
                setError("");
                setStep(2);
              }}
              className="w-full bg-orange text-cream py-4 rounded-full font-bold text-lg tracking-wider flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              CONTINUAR
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Step 2: Pago */}
        {step === 2 && (
          <>
            <div className="mb-6">
              <h3
                className="text-cream text-2xl mb-1"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                REALIZA EL PAGO
              </h3>
              <p className="text-muted text-sm">
                Transfiere a la siguiente cuenta
              </p>
            </div>

            <div className="flex-1">
              <div className="bg-surface rounded-2xl p-6 space-y-6">
                {/* Monto */}
                <div className="text-center pb-4 border-b border-line">
                  <p className="text-muted text-xs mb-1">VALOR A PAGAR</p>
                  <p
                    className="text-orange text-4xl font-bold"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    $30.000
                  </p>
                </div>

                {/* Llave Bre-B */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">B</span>
                    </div>
                    <div>
                      <p className="text-cream font-semibold">LLAVE BRE-B</p>
                      <p className="text-muted text-sm">Transfiere desde cualquier banco</p>
                    </div>
                  </div>

                  <button
                    onClick={() => copyToClipboard("@bfms892177")}
                    className="w-full bg-surface-light rounded-xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform"
                  >
                    <span
                      className="text-cream text-2xl tracking-wider"
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
                      @bfms892177
                    </span>
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-muted" />
                    )}
                  </button>
                </div>

                {/* Nota */}
                <div className="bg-orange/10 border border-orange/30 rounded-xl p-4">
                  <p className="text-orange text-sm text-center">
                    Incluye en la descripción: <strong>RIFA #{ticketNumber}</strong>
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full bg-orange text-cream py-4 rounded-full font-bold text-lg tracking-wider flex items-center justify-center gap-3 active:scale-[0.98] transition-transform mt-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              YA PAGUÉ
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Step 3: Comprobante */}
        {step === 3 && (
          <>
            <div className="mb-6">
              <h3
                className="text-cream text-2xl mb-1"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                SUBE TU COMPROBANTE
              </h3>
              <p className="text-muted text-sm">
                Captura o foto del pago realizado
              </p>
            </div>

            <div className="flex-1">
              <label className="block cursor-pointer">
                <div
                  className={`
                    border-2 border-dashed rounded-2xl p-8 text-center transition-colors
                    ${preview ? 'border-orange bg-orange/10' : 'border-line hover:border-orange/50'}
                  `}
                >
                  {preview ? (
                    <div className="space-y-4">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-48 mx-auto object-contain rounded-lg"
                      />
                      <div className="flex items-center justify-center gap-2 text-orange">
                        <Check className="w-5 h-5" />
                        <span className="text-sm">Imagen cargada</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-muted py-8">
                      <Upload className="w-12 h-12 mx-auto" />
                      <p className="text-lg">Toca para subir</p>
                      <p className="text-xs">PNG, JPG (máx 5MB)</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm text-center mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !file}
              className={`
                w-full py-4 rounded-full font-bold text-lg tracking-wider
                flex items-center justify-center gap-3 transition-all
                ${file ? 'bg-orange text-cream active:scale-[0.98]' : 'bg-surface text-muted cursor-not-allowed'}
              `}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  CONFIRMAR RESERVA
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </>
        )}

        {/* Step 4: Éxito */}
        {step === 4 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>

            <h3
              className="text-cream text-3xl mb-2"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              ¡RESERVA EXITOSA!
            </h3>

            <p className="text-muted mb-6">
              Tu boleta <span className="text-orange font-bold">#{ticketNumber}</span> ha sido reservada
            </p>

            <div className="bg-surface rounded-2xl p-6 w-full mb-8">
              <p className="text-cream/70 text-sm mb-4">
                Te contactaremos por WhatsApp para confirmar tu pago.
              </p>
              <div className="flex items-center gap-2 justify-center text-gold">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span className="text-sm">Sorteo: 24 Oct 2026 - Lotería de Boyacá</span>
              </div>
            </div>

            <button
              onClick={onSuccess}
              className="w-full bg-cream text-bg py-4 rounded-full font-bold text-lg tracking-wider active:scale-[0.98] transition-transform"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              CERRAR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
