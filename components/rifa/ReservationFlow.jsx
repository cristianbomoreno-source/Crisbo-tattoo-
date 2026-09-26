"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Upload, Check, Loader2, ArrowLeft, ArrowRight, Copy, Smartphone, Camera, Send, User, Phone, Mail } from "lucide-react";

export default function ReservationFlow({ ticketNumbers, onClose, onSuccess }) {
  const totalAmount = ticketNumbers.length * 30000;
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
    if (!formData.name || !formData.whatsapp || !formData.email) {
      setError("Todos los campos son obligatorios");
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
      submitData.append("ticketNumbers", JSON.stringify(ticketNumbers));
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

      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = {
    1: "Tus datos",
    2: "Realiza el pago",
    3: "Sube comprobante",
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg overflow-y-auto">
      {/* Header con logo */}
      <div className="sticky top-0 bg-bg/95 backdrop-blur-sm z-10 border-b border-line">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
            className="w-10 h-10 flex items-center justify-center text-muted hover:text-cream transition-colors rounded-full hover:bg-surface"
          >
            {step === 1 || step === 4 ? <X className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <div className="relative w-36 h-20">
            <Image
              src="/images/logo-crisbo.png"
              alt="Crisbo Tattoo"
              fill
              className="object-contain brightness-0 invert"
            />
          </div>

          <div className="w-10" />
        </div>

        {/* Progress bar con pasos */}
        {step < 4 && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors
                    ${step === s ? 'bg-orange text-bg' : step > s ? 'bg-green-500 text-white' : 'bg-surface text-muted'}
                  `}
                >
                  {step > s ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    s
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    step >= s ? 'bg-orange' : 'bg-surface'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Boletas seleccionadas */}
      {step < 4 && (
        <div className="mx-4 mt-4 bg-surface rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted text-sm">
              {ticketNumbers.length === 1 ? 'Tu boleta:' : `Tus ${ticketNumbers.length} boletas:`}
            </span>
            <span className="text-gold text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              ${totalAmount.toLocaleString('es-CO')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ticketNumbers.map(num => (
              <span
                key={num}
                className="bg-orange/20 text-orange px-2 py-0.5 rounded-full text-sm font-bold"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                #{num}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="flex flex-col min-h-[calc(100vh-180px)] p-4">
        {/* Step 1: Datos */}
        {step === 1 && (
          <>
            <div className="mb-6">
              <h2
                className="text-cream text-2xl mb-1"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                ¿CÓMO TE LLAMAS?
              </h2>
              <p className="text-muted text-sm">
                Necesitamos tus datos para contactarte si ganas
              </p>
            </div>

            <div className="space-y-5 flex-1">
              {/* Nombre */}
              <div>
                <label className="text-cream text-sm font-medium flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-orange" />
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface border-2 border-line rounded-2xl px-5 py-4 text-cream text-lg placeholder:text-muted focus:border-orange focus:outline-none transition-colors"
                  placeholder="Ej: Juan Pérez"
                  autoFocus
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="text-cream text-sm font-medium flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-orange" />
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full bg-surface border-2 border-line rounded-2xl px-5 py-4 text-cream text-lg placeholder:text-muted focus:border-orange focus:outline-none transition-colors"
                  placeholder="Ej: 320 123 4567"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-cream text-sm font-medium flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-orange" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-surface border-2 border-line rounded-2xl px-5 py-4 text-cream text-lg placeholder:text-muted focus:border-orange focus:outline-none transition-colors"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-2xl text-sm text-center mb-4">
                {error}
              </div>
            )}

            <button
              onClick={() => {
                if (!formData.name || !formData.whatsapp || !formData.email) {
                  setError("Todos los campos son obligatorios");
                  return;
                }
                setError("");
                setStep(2);
              }}
              className="w-full bg-orange text-cream py-5 rounded-full font-bold text-lg tracking-wider flex items-center justify-center gap-3 active:scale-[0.98] transition-transform shadow-lg shadow-orange/30"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              SIGUIENTE
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Step 2: Pago */}
        {step === 2 && (
          <>
            <div className="mb-4">
              <h2
                className="text-cream text-2xl mb-1"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                PAGA TU BOLETA
              </h2>
              <p className="text-muted text-sm">
                Escanea el QR o usa la llave Bre-B
              </p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto">
              {/* Monto */}
              <div className="bg-orange rounded-2xl p-5 text-center">
                <p className="text-cream/80 text-xs mb-1">VALOR A PAGAR</p>
                <p
                  className="text-cream text-5xl font-bold"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  ${totalAmount.toLocaleString('es-CO')}
                </p>
                <p className="text-cream/60 text-xs mt-1">
                  {ticketNumbers.length === 1 ? '1 boleta' : `${ticketNumbers.length} boletas × $30.000`}
                </p>
              </div>

              {/* Instrucciones */}
              <div className="bg-surface rounded-2xl p-4">
                <p className="text-gold text-xs font-semibold tracking-wider mb-4">SIGUE ESTOS PASOS:</p>

                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-orange/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-5 h-5 text-orange" />
                    </div>
                    <div>
                      <p className="text-cream font-medium">1. Abre tu app del banco</p>
                      <p className="text-muted text-xs">Bancolombia, Davivienda, Nequi, etc.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-orange/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Camera className="w-5 h-5 text-orange" />
                    </div>
                    <div>
                      <p className="text-cream font-medium">2. Escanea este código QR</p>
                      <p className="text-muted text-xs">Busca "Pagar con QR" o "Transfiya"</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-orange/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Send className="w-5 h-5 text-orange" />
                    </div>
                    <div>
                      <p className="text-cream font-medium">3. Envía ${totalAmount.toLocaleString('es-CO')}</p>
                      <p className="text-muted text-xs">
                        En descripción escribe: <span className="text-orange font-bold">RIFA #{ticketNumbers.join(', #')}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR */}
              <div className="bg-white rounded-2xl p-3">
                <div className="relative w-full aspect-square max-w-[220px] mx-auto">
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
                <p className="text-muted text-xs mb-3 text-center">¿No puedes escanear? Copia la llave:</p>
                <button
                  onClick={() => copyToClipboard("@bfms892177")}
                  className="w-full bg-surface-light rounded-xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform border-2 border-transparent hover:border-orange/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-xl">B</span>
                    </div>
                    <div className="text-left">
                      <p className="text-cream/60 text-xs">Llave Bre-B</p>
                      <p className="text-cream text-xl font-bold" style={{ fontFamily: 'var(--font-headline)' }}>
                        @bfms892177
                      </p>
                    </div>
                  </div>
                  {copied ? (
                    <div className="bg-green-500 rounded-full p-2">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="bg-surface rounded-full p-2">
                      <Copy className="w-5 h-5 text-muted" />
                    </div>
                  )}
                </button>
              </div>

              {/* Recordatorio */}
              <div className="bg-orange/10 border-2 border-orange/30 rounded-2xl p-4">
                <p className="text-orange text-sm text-center font-medium">
                  ⚠️ Escribe <strong>RIFA #{ticketNumbers.join(', #')}</strong> en la descripción del pago
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full bg-orange text-cream py-5 rounded-full font-bold text-lg tracking-wider flex items-center justify-center gap-3 active:scale-[0.98] transition-transform mt-4 shadow-lg shadow-orange/30"
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
              <h2
                className="text-cream text-2xl mb-1"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                SUBE TU COMPROBANTE
              </h2>
              <p className="text-muted text-sm">
                Necesitamos verificar tu pago
              </p>
            </div>

            <div className="flex-1">
              <label className="block cursor-pointer">
                <div
                  className={`
                    border-3 border-dashed rounded-3xl p-6 text-center transition-all min-h-[200px] flex flex-col items-center justify-center
                    ${preview ? 'border-orange bg-orange/10' : 'border-line hover:border-orange/50 bg-surface'}
                  `}
                >
                  {preview ? (
                    <div className="space-y-4">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-40 mx-auto object-contain rounded-xl"
                      />
                      <div className="flex items-center justify-center gap-2 text-green-500">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">¡Imagen cargada!</span>
                      </div>
                      <p className="text-muted text-xs">Toca para cambiar</p>
                    </div>
                  ) : (
                    <div className="space-y-4 text-muted py-4">
                      <div className="w-16 h-16 bg-surface-light rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-cream text-lg font-medium">Toca para subir</p>
                        <p className="text-xs">Captura de pantalla o foto</p>
                      </div>
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

              {/* Qué debe mostrar */}
              <div className="mt-6 bg-surface rounded-2xl p-4">
                <p className="text-cream font-medium text-sm mb-3">✅ El comprobante debe mostrar:</p>
                <ul className="space-y-2 text-muted text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange rounded-full" />
                    Fecha y hora del pago
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange rounded-full" />
                    Monto: $30.000
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange rounded-full" />
                    Estado: Exitoso/Aprobado
                  </li>
                </ul>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-2xl text-sm text-center mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !file}
              className={`
                w-full py-5 rounded-full font-bold text-lg tracking-wider
                flex items-center justify-center gap-3 transition-all
                ${file ? 'bg-orange text-cream active:scale-[0.98] shadow-lg shadow-orange/30' : 'bg-surface text-muted cursor-not-allowed'}
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
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            {/* Animación de éxito */}
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <Check className="w-12 h-12 text-white" />
            </div>

            <h2
              className="text-cream text-3xl mb-2"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              ¡LISTO!
            </h2>

            <p className="text-muted text-lg mb-6">
              {ticketNumbers.length === 1
                ? <>Tu boleta <span className="text-orange font-bold">#{ticketNumbers[0]}</span> está reservada</>
                : <>Tus {ticketNumbers.length} boletas están reservadas</>
              }
            </p>

            {ticketNumbers.length > 1 && (
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {ticketNumbers.map(num => (
                  <span
                    key={num}
                    className="bg-orange text-bg px-3 py-1 rounded-full text-lg font-bold"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    #{num}
                  </span>
                ))}
              </div>
            )}

            <div className="bg-surface rounded-2xl p-6 w-full mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-left">
                  <p className="text-cream font-medium">Reserva recibida</p>
                  <p className="text-muted text-xs">Verificaremos tu pago</p>
                </div>
              </div>

              <div className="border-t border-line pt-4">
                <p className="text-cream/70 text-sm">
                  📱 Te contactaremos por <strong>WhatsApp</strong> para confirmar tu participación.
                </p>
              </div>
            </div>

            <div className="bg-gold/10 border border-gold/30 rounded-2xl p-4 w-full mb-6">
              <p className="text-gold text-sm">
                🎰 <strong>Sorteo:</strong> 24 Oct 2026 - Lotería de Boyacá
              </p>
            </div>

            <button
              onClick={onSuccess}
              className="w-full bg-cream text-bg py-5 rounded-full font-bold text-lg tracking-wider active:scale-[0.98] transition-transform"
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
