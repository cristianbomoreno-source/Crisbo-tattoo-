"use client";

import { useState } from "react";
import { X, Upload, Check, Loader2 } from "lucide-react";

export default function ReservationModal({ ticketNumber, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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
      // Validar tipo
      if (!selectedFile.type.startsWith("image/")) {
        setError("Solo se permiten imagenes");
        return;
      }
      // Validar tamaño (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("La imagen debe ser menor a 5MB");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError("");
    }
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
      // Crear FormData para enviar archivo
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

      onSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-bg/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border-2 border-line w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-up">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-line p-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl text-cream">RESERVAR BOLETA</h3>
            <p className="text-gold font-display text-2xl"># {ticketNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-light transition-colors"
          >
            <X className="w-6 h-6 text-muted" />
          </button>
        </div>

        {/* Pasos */}
        <div className="flex border-b border-line">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 py-2 text-center text-sm font-display ${
                step === s
                  ? "bg-gold text-bg"
                  : step > s
                  ? "bg-teal text-cream"
                  : "bg-surface-light text-muted"
              }`}
            >
              {s === 1 && "DATOS"}
              {s === 2 && "PAGO"}
              {s === 3 && "COMPROBANTE"}
            </div>
          ))}
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-4">
          {/* Step 1: Datos */}
          {step === 1 && (
            <>
              <div>
                <label className="label block mb-2">Nombre completo *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-editorial"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="label block mb-2">WhatsApp *</label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="input-editorial"
                  placeholder="3XX XXX XXXX"
                />
              </div>
              <div>
                <label className="label block mb-2">Email (opcional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-editorial"
                  placeholder="tu@email.com"
                />
              </div>
              <button
                onClick={() => {
                  if (!formData.name || !formData.whatsapp) {
                    setError("Nombre y WhatsApp son obligatorios");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
                className="btn-primary w-full"
              >
                CONTINUAR
              </button>
            </>
          )}

          {/* Step 2: Info de pago */}
          {step === 2 && (
            <>
              <div className="torn-paper bg-cream text-bg p-6 text-center space-y-4">
                <div className="sticker inline-block">$30.000 COP</div>
                <div className="space-y-2">
                  <p className="font-display text-xl">NEQUI</p>
                  <p className="text-3xl font-bold tracking-wider">320 210 7769</p>
                  <p className="text-sm text-cement">Cristian Buitrago</p>
                </div>
                <div className="pt-4 border-t border-cement/20">
                  <p className="text-sm text-cement">
                    Incluye en la descripcion del pago:<br/>
                    <span className="font-bold text-bg">RIFA #{ticketNumber}</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1"
                >
                  ATRAS
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="btn-primary flex-1"
                >
                  YA PAGUE
                </button>
              </div>
            </>
          )}

          {/* Step 3: Subir comprobante */}
          {step === 3 && (
            <>
              <p className="text-muted text-sm text-center">
                Sube una captura o foto del comprobante de pago
              </p>

              <label className="block cursor-pointer">
                <div className={`border-2 border-dashed ${preview ? 'border-gold' : 'border-line'} p-8 text-center hover:border-gold/50 transition-colors`}>
                  {preview ? (
                    <div className="space-y-2">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-40 mx-auto object-contain"
                      />
                      <p className="text-sm text-gold flex items-center justify-center gap-1">
                        <Check className="w-4 h-4" />
                        Imagen cargada
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-muted">
                      <Upload className="w-8 h-8 mx-auto" />
                      <p>Toca para subir imagen</p>
                      <p className="text-xs">PNG, JPG (max 5MB)</p>
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

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  ATRAS
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !file}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "CONFIRMAR"
                  )}
                </button>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
