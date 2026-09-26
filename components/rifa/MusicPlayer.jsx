"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
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
        setIsReady(true);
      } catch (error) {
        // Autoplay bloqueado - esperar interacción del usuario
        console.log("Esperando interacción del usuario para reproducir música");
        setIsReady(true);
      }
    };

    tryAutoplay();

    // Si no se pudo reproducir automáticamente, reproducir al primer toque/click
    const playOnInteraction = async () => {
      if (audioRef.current && !isPlaying) {
        try {
          audioRef.current.currentTime = 35;
          await audioRef.current.play();
          setIsPlaying(true);
          // Remover los listeners después de reproducir
          document.removeEventListener("click", playOnInteraction);
          document.removeEventListener("touchstart", playOnInteraction);
          document.removeEventListener("scroll", playOnInteraction);
        } catch (error) {
          console.error("Error playing:", error);
        }
      }
    };

    // Agregar listeners para reproducir al primer toque
    document.addEventListener("click", playOnInteraction);
    document.addEventListener("touchstart", playOnInteraction);
    document.addEventListener("scroll", playOnInteraction);

    // Cleanup
    return () => {
      document.removeEventListener("click", playOnInteraction);
      document.removeEventListener("touchstart", playOnInteraction);
      document.removeEventListener("scroll", playOnInteraction);
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
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }
  };

  // Solo mostrar el botón flotante cuando esté listo
  if (!isReady) return null;

  return (
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
  );
}
