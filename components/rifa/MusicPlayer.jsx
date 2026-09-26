"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Crear el elemento de audio
    const audio = new Audio("/audio/la-villa.mp3");
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    // Intentar reproducir automáticamente desde el segundo 35
    const tryAutoplay = async () => {
      try {
        audio.currentTime = 35;
        await audio.play();
        setIsPlaying(true);
        setHasInteracted(true);
      } catch (error) {
        // Autoplay bloqueado, mostrar botón
        console.log("Autoplay bloqueado, esperando interacción del usuario");
        setShowPrompt(true);
      }
    };

    tryAutoplay();

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        if (!hasInteracted) {
          audioRef.current.currentTime = 35;
        }
        await audioRef.current.play();
        setIsPlaying(true);
        setHasInteracted(true);
        setShowPrompt(false);
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }
  };

  // Botón flotante para activar/desactivar música
  return (
    <>
      {/* Prompt inicial para activar música */}
      {showPrompt && !hasInteracted && (
        <div className="fixed inset-0 z-[100] bg-bg/95 flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-8 max-w-sm text-center border border-line">
            <div className="w-20 h-20 bg-orange/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Music className="w-10 h-10 text-orange" />
            </div>
            <h2
              className="text-cream text-2xl mb-2"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              LA VILLA
            </h2>
            <p className="text-gold text-sm mb-1">Ryan Castro, Kapo, Gangsta</p>
            <p className="text-muted text-xs mb-6">
              Activa el sonido para vivir la experiencia completa
            </p>
            <button
              onClick={togglePlay}
              className="w-full bg-orange text-cream py-4 rounded-full font-bold text-lg tracking-wider flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Volume2 className="w-6 h-6" />
              ACTIVAR MÚSICA
            </button>
            <button
              onClick={() => {
                setShowPrompt(false);
                setHasInteracted(true);
              }}
              className="mt-4 text-muted text-sm hover:text-cream transition-colors"
            >
              Continuar sin música
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      {hasInteracted && (
        <button
          onClick={togglePlay}
          className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
            isPlaying
              ? 'bg-orange text-cream shadow-orange/30'
              : 'bg-surface text-muted border border-line hover:border-orange'
          }`}
        >
          {isPlaying ? (
            <Volume2 className="w-6 h-6" />
          ) : (
            <VolumeX className="w-6 h-6" />
          )}
        </button>
      )}
    </>
  );
}
