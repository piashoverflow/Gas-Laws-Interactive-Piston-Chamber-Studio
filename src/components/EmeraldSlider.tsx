import React from 'react';
import { Lock } from 'lucide-react';

interface EmeraldSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  decimals?: number;
  secondaryReadout?: string;
  disabled?: boolean;
  lockedText?: string;
  onChange: (value: number) => void;
}

export const EmeraldSlider: React.FC<EmeraldSliderProps> = ({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  decimals = 2,
  secondaryReadout,
  disabled = false,
  lockedText,
  onChange,
}) => {
  const safeValue = Math.min(max, Math.max(min, value));
  const pct = max > min ? ((safeValue - min) / (max - min)) * 100 : 0;

  const trackBackground = disabled
    ? `linear-gradient(to right, #94a3b8 0%, #94a3b8 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`
    : `linear-gradient(to right, #059669 0%, #059669 ${pct}%, #d1fae5 ${pct}%, #d1fae5 100%)`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 truncate"
        >
          {disabled && <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
          <span className="truncate">{label}</span>
        </label>
        <div className="flex items-baseline gap-1 shrink-0 font-mono tabular-nums">
          <span className="text-sm font-bold text-slate-950">
            {safeValue.toFixed(decimals)}
          </span>
          <span className="text-[11px] font-medium text-slate-500">{unit}</span>
          {secondaryReadout && (
            <span className="text-[11px] text-sky-700 ml-1">({secondaryReadout})</span>
          )}
        </div>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeValue}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ background: trackBackground }}
        className="emerald-slider block w-full"
      />

      <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-500">
        <span>
          {min} {unit}
        </span>
        {lockedText && (
          <span className="text-amber-700 font-sans font-medium">{lockedText}</span>
        )}
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
};
