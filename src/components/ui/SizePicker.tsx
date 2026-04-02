"use client";

interface SizeOption {
  value: string;
  label: string;
}

interface SizePickerProps {
  value: string;
  onChange: (value: string) => void;
  options: SizeOption[];
  label?: string;
  description?: string;
}

// Visual aspect ratio representations
const RATIO_SHAPES: Record<string, { w: number; h: number }> = {
  square_hd: { w: 20, h: 20 },
  square: { w: 20, h: 20 },
  portrait_4_3: { w: 16, h: 20 },
  portrait_16_9: { w: 12, h: 20 },
  landscape_4_3: { w: 20, h: 16 },
  landscape_16_9: { w: 20, h: 12 },
  "1:1": { w: 20, h: 20 },
  "4:3": { w: 20, h: 15 },
  "3:4": { w: 15, h: 20 },
  "16:9": { w: 20, h: 11 },
  "9:16": { w: 11, h: 20 },
  "3:2": { w: 20, h: 13 },
  "2:3": { w: 13, h: 20 },
  "21:9": { w: 20, h: 9 },
  "4:5": { w: 16, h: 20 },
  "5:4": { w: 20, h: 16 },
};

function RatioPreview({ value }: { value: string }) {
  const shape = RATIO_SHAPES[value] ?? { w: 20, h: 20 };
  return (
    <div className="flex items-center justify-center w-8 h-8">
      <div
        className="border border-current rounded-sm opacity-70"
        style={{ width: shape.w, height: shape.h }}
      />
    </div>
  );
}

export function SizePicker({ value, onChange, options, label, description }: SizePickerProps) {
  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-[#b8cfdf]">{label}</label>}
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border text-xs transition-all ${
                active
                  ? "border-[#00e5c9]/50 bg-[#00e5c9]/10 text-[#00e5c9]"
                  : "border-white/10 bg-[#050508] text-[#8898a5] hover:border-white/20 hover:text-[#b8cfdf]"
              }`}
            >
              <RatioPreview value={opt.value} />
              <span className="text-center leading-tight">{opt.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>
      {description && <p className="text-xs text-[#8898a5]">{description}</p>}
    </div>
  );
}

export function AspectRatioPicker({ value, onChange, options, label }: SizePickerProps) {
  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-[#b8cfdf]">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                active
                  ? "border-[#00e5c9]/50 bg-[#00e5c9]/10 text-[#00e5c9]"
                  : "border-white/10 bg-[#050508] text-[#8898a5] hover:border-white/20 hover:text-[#b8cfdf]"
              }`}
            >
              <RatioPreview value={opt.value} />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
