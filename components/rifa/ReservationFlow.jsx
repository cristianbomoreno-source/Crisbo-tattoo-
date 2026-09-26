"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Upload, Check, Loader2, ArrowLeft, ArrowRight, Copy, Smartphone, Camera, Send } from "lucide-react";

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
    <div className="fixed inset-0 z-50 bg-bg overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-bg z-10 flex items-center justify-between p-4 border-b border-line">
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
      <div className="flex flex-col min-h-[calc(100vh-120px)] p-4">
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
            <div className="mb-4">
              <h3
                className="text-cream text-2xl mb-1"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                REALIZA EL PAGO
              </h3>
              <p className="text-muted text-sm">
                Sigue estos pasos para completar tu pago
              </p>
            </div>

            <div className="flex-1 space-y-4">
              {/* Monto a pagar */}
              <div className="bg-orange/20 border border-orange rounded-2xl p-4 text-center">
                <p className="text-cream/70 text-xs mb-1">VALOR A PAGAR</p>
                <p
                  className="text-orange text-4xl font-bold"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  $30.000 COP
                </p>
              </div>

              {/* Paso a paso */}
              <div className="bg-surface rounded-2xl p-4 space-y-4">
                <p className="text-gold text-xs font-semibold tracking-wider">PASO A PASO</p>

                {/* Paso 1 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-4 h-4 text-orange" />
                  </div>
                  <div>
                    <p className="text-cream font-medium text-sm">1. Abre tu app bancaria</p>
                    <p className="text-muted text-xs">Bancolombia, Davivienda, Nequi, o cualquier banco</p>
                  </div>
                </div>

                {/* Paso 2 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Camera className="w-4 h-4 text-orange" />
                  </div>
                  <div>
                    <p className="text-cream font-medium text-sm">2. Escanea el código QR</p>
                    <p className="text-muted text-xs">O busca la opción "Pagar con QR" / "Transfiya"</p>
                  </div>
                </div>

                {/* Paso 3 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Send className="w-4 h-4 text-orange" />
                  </div>
                  <div>
                    <p className="text-cream font-medium text-sm">3. Envía $30.000</p>
                    <p className="text-muted text-xs">En la descripción escribe: <span className="text-orange font-semibold">RIFA #{ticketNumber}</span></p>
                  </div>
                </div>
              </div>

              {/* Código QR */}
              <div className="bg-white rounded-2xl p-4">
                <div className="relative w-full aspect-square max-w-[250px] mx-auto">
                  <Image
                    src="/images/qr-pago.jpg"
                    alt="Código QR para pago"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Llave alternativa */}
              <div className="bg-surface rounded-2xl p-4">
                <p className="text-muted text-xs mb-3 text-center">¿No puedes escanear? Usa la llave:</p>
                <button
                  onClick={() => copyToClipboard("@bfms892177")}
                  className="w-full bg-surface-light rounded-xl p-3 flex items-center justify-between active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">B</span>
                    </div>
                    <div className="text-left">
                      <p className="text-cream font-semibold text-sm">Llave Bre-B</p>
                      <p className="text-gold text-lg" style={{ fontFamily: 'var(--font-headline)' }}>@bfms892177</p>
                    </div>
                  </div>
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-muted" />
                  )}
                </button>
              </div>

              {/* Recordatorio */}
              <div className="bg-orange/10 border border-orange/30 rounded-xl p-3">
                <p className="text-orange text-xs text-center">
                  <strong>Importante:</strong> En la descripción del pago escribe <strong>RIFA #{ticketNumber}</strong>
                </p>
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
                Toma una captura de pantalla o foto del comprobante de pago
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
                        <span className="text-sm">Imagen cargada - Toca para cambiar</span>
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

              {/* Qué debe mostrar el comprobante */}
              <div className="mt-4 bg-surface rounded-xl p-4">
                <p className="text-cream/70 text-xs mb-2">El comprobante debe mostrar:</p>
                <ul className="space-y-1 text-muted text-xs">
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    Fecha y hora del pago
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    Monto: $30.000
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    Destinatario o llave
                  </li>
                </ul>
              </div>
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
                Revisaremos tu pago y te confirmaremos por WhatsApp en las próximas horas.
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
