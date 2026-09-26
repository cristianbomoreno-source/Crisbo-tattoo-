"use client";

import { useState, useEffect } from "react";

export default function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeBlock = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Fondo con efecto papel rasgado */}
        <div className="torn-paper bg-surface p-3 sm:p-4 min-w-[60px] sm:min-w-[80px]">
          <span className="font-display text-2xl sm:text-4xl text-gold block text-center">
            {String(value).padStart(2, "0")}
          </span>
        </div>
        {/* Cinta adhesiva decorativa */}
        <div className="tape w-10 sm:w-14 h-3 -top-2 left-1/2 -translate-x-1/2" />
      </div>
      <span className="label-gold mt-2 text-[10px]">{label}</span>
    </div>
  );

  return (
    <div className="flex gap-3 sm:gap-4 justify-center">
      <TimeBlock value={timeLeft.days} label="DIAS" />
      <TimeBlock value={timeLeft.hours} label="HORAS" />
      <TimeBlock value={timeLeft.minutes} label="MIN" />
      <TimeBlock value={timeLeft.seconds} label="SEG" />
    </div>
  );
}
