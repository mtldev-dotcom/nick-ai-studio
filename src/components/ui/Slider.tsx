"use client";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Slider({ value, onChange, min, max, step = 1, label, description, disabled }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[#b8cfdf]">{label}</label>
          <span className="text-sm font-mono text-[#00e5c9] tabular-nums">{value}</span>
        </div>
      )}
      <div className="relative flex items-center h-6">
        {/* Track background */}
        <div className="absolute inset-y-0 flex items-center w-full">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00e5c9] rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {/* Native input (transparent overlay for interaction) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="relative w-full h-6 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          style={{ WebkitAppearance: "none" }}
        />
        {/* Custom thumb */}
        <div
          className="absolute w-4 h-4 rounded-full bg-[#00e5c9] border-2 border-[#080808] shadow-lg pointer-events-none transition-all"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
      {description && (
        <p className="text-xs text-[#8898a5]">{description}</p>
      )}
    </div>
  );
}
