"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Verificar password (simple para esta implementación)
    // En producción, esto debería ser una verificación en el servidor
    if (password === "crisbo2026") {
      // Guardar sesión en localStorage
      localStorage.setItem("admin_auth", "true");
      router.push("/admin/dashboard");
    } else {
      setError("Contraseña incorrecta");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-gothic text-poster-sm text-gold">CRISBO</h1>
          <p className="font-display text-cream">ADMIN</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card-editorial p-6 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-surface-light mx-auto flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-gold" />
            </div>
            <h2 className="font-display text-xl text-cream">Acceso Admin</h2>
            <p className="text-muted text-sm mt-1">
              Ingresa la contraseña para continuar
            </p>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-editorial pr-12"
              placeholder="Contraseña"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-cream"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Verificando..." : "ENTRAR"}
          </button>
        </form>

        {/* Back link */}
        <div className="text-center mt-6">
          <a href="/" className="text-muted text-sm hover:text-gold">
            Volver a la rifa
          </a>
        </div>
      </div>
    </div>
  );
}
