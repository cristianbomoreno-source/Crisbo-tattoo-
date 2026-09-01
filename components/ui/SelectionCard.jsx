"use client";

import { Check } from "lucide-react";

export default function SelectionCard({
  selected = false,
  onClick,
  icon: Icon,
  title,
  description,
  className = "",
  children,
}) {
  return (
    <button
      onClick={onClick}
      className={`selection-card w-full text-left ${
        selected ? "selected" : ""
      } ${className}`}
      aria-pressed={selected}
    >
      {/* Check mark */}
      <span className="check-mark">
        <Check size={12} strokeWidth={3} />
      </span>

      {/* Content */}
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="card-icon text-muted mt-0.5 transition-colors">
            <Icon size={20} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ink text-sm">{title}</p>
          {description && (
            <p className="text-muted text-xs mt-1 leading-relaxed">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </button>
  );
}
