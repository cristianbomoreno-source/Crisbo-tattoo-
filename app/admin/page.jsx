"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

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

    if (password === "crisbo2026") {
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
        <div className="flex justify-center mb-8">
          <div className="relative w-48 h-32">
            <Image
              src="/images/logo-crisbo.png"
              alt="Crisbo Tattoo"
              fill
              className="object-contain brightness-0 invert"
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-surface rounded-3xl p-6 space-y-6 border border-line">
          <div className="text-center">
            <div className="w-16 h-16 bg-gold/20 rounded-full mx-auto flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-gold" />
            </div>
            <h2 className="text-xl text-cream font-bold" style={{ fontFamily: 'var(--font-headline)' }}>
              PANEL ADMIN
            </h2>
            <p className="text-muted text-sm mt-1">
              Ingresa la contraseña para continuar
            </p>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg border-2 border-line rounded-2xl px-5 py-4 text-cream placeholder:text-muted focus:border-gold focus:outline-none transition-colors pr-12"
              placeholder="Contraseña"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-cream transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-gold text-bg py-4 rounded-full font-bold text-lg tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {loading ? "Verificando..." : "ENTRAR"}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        {/* Back link */}
        <div className="text-center mt-6">
          <a href="/" className="text-muted text-sm hover:text-gold transition-colors">
            ← Volver a la rifa
          </a>
        </div>
      </div>
    </div>
  );
}
