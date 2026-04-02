"use client";

import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { SizePicker, AspectRatioPicker } from "@/components/ui/SizePicker";
import { AssetPicker } from "@/components/generation/AssetPicker";
import type { ModelParam } from "@/lib/models";

interface DynamicParamFormProps {
  params: ModelParam[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

function paramValue<T>(values: Record<string, unknown>, key: string, fallback: T): T {
  return key in values ? (values[key] as T) : fallback;
}

export function DynamicParamForm({ params, values, onChange }: DynamicParamFormProps) {
  return (
    <div className="space-y-5">
      {params.map((param) => (
        <ParamField key={param.key} param={param} values={values} onChange={onChange} />
      ))}
    </div>
  );
}

function ParamField({
  param,
  values,
  onChange,
}: {
  param: ModelParam;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const { key, label, type, required, default: defaultVal, description, min, max, step, options } = param;

  switch (type) {
    case "textarea": {
      const val = paramValue<string>(values, key, "");
      return (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#b8cfdf]">
            {label}
            {required && <span className="text-[#ff5240] ml-1">*</span>}
          </label>
          <textarea
            value={val}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={description || `Enter ${label.toLowerCase()}…`}
            rows={key === "prompt" ? 4 : 2}
            className="w-full px-4 py-3 bg-[#050508] border border-white/10 rounded-xl text-[#b8cfdf] placeholder-[#8898a5] focus:outline-none focus:border-[#00e5c9]/50 resize-none text-sm transition-colors"
          />
          {description && key !== "prompt" && (
            <p className="text-xs text-[#8898a5]">{description}</p>
          )}
        </div>
      );
    }

    case "text": {
      const val = paramValue<string>(values, key, (defaultVal as string) ?? "");
      return (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#b8cfdf]">
            {label}
            {required && <span className="text-[#ff5240] ml-1">*</span>}
          </label>
          <input
            type="text"
            value={val}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={description || `Enter ${label.toLowerCase()}…`}
            className="w-full px-4 py-3 bg-[#050508] border border-white/10 rounded-xl text-[#b8cfdf] placeholder-[#8898a5] focus:outline-none focus:border-[#00e5c9]/50 text-sm transition-colors"
          />
          {description && <p className="text-xs text-[#8898a5]">{description}</p>}
        </div>
      );
    }

    case "number": {
      const val = paramValue<string>(values, key, "");
      return (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#b8cfdf]">
            {label}
          </label>
          <input
            type="number"
            value={val}
            min={min}
            max={max}
            step={step ?? 1}
            onChange={(e) => onChange(key, e.target.value ? Number(e.target.value) : undefined)}
            placeholder={description || `Optional…`}
            className="w-full px-4 py-3 bg-[#050508] border border-white/10 rounded-xl text-[#b8cfdf] placeholder-[#8898a5] focus:outline-none focus:border-[#00e5c9]/50 text-sm transition-colors"
          />
          {description && <p className="text-xs text-[#8898a5]">{description}</p>}
        </div>
      );
    }

    case "slider": {
      const val = paramValue<number>(values, key, (defaultVal as number) ?? min ?? 0);
      return (
        <Slider
          label={label}
          value={val}
          onChange={(v) => onChange(key, v)}
          min={min ?? 0}
          max={max ?? 100}
          step={step ?? 1}
          description={description}
        />
      );
    }

    case "select": {
      const val = paramValue<string>(values, key, (defaultVal as string) ?? "");
      if (!options?.length) return null;
      return (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#b8cfdf]">{label}</label>
          <select
            value={String(val)}
            onChange={(e) => onChange(key, e.target.value)}
            className="w-full px-4 py-3 bg-[#050508] border border-white/10 rounded-xl text-[#b8cfdf] focus:outline-none focus:border-[#00e5c9]/50 text-sm transition-colors appearance-none cursor-pointer"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {description && <p className="text-xs text-[#8898a5]">{description}</p>}
        </div>
      );
    }

    case "toggle": {
      const val = paramValue<boolean>(values, key, (defaultVal as boolean) ?? false);
      return (
        <Toggle
          checked={val}
          onChange={(v) => onChange(key, v)}
          label={label}
          description={description}
        />
      );
    }

    case "size-picker": {
      const val = paramValue<string>(values, key, (defaultVal as string) ?? "square_hd");
      if (!options?.length) return null;
      return (
        <SizePicker
          label={label}
          value={val}
          onChange={(v) => onChange(key, v)}
          options={options}
          description={description}
        />
      );
    }

    case "aspect-ratio": {
      const val = paramValue<string>(values, key, (defaultVal as string) ?? "1:1");
      if (!options?.length) return null;
      return (
        <AspectRatioPicker
          label={label}
          value={val}
          onChange={(v) => onChange(key, v)}
          options={options}
        />
      );
    }

    case "image-upload": {
      const val = paramValue<string>(values, key, "");
      return (
        <AssetPicker
          label={label}
          value={val || null}
          onChange={(v) => onChange(key, Array.isArray(v) ? v[0] ?? "" : v)}
          mode="single"
          required={required}
          description={description}
        />
      );
    }

    case "images-upload": {
      const val = paramValue<string[]>(values, key, []);
      return (
        <AssetPicker
          label={label}
          value={val}
          onChange={(v) => onChange(key, Array.isArray(v) ? v : [v])}
          mode="multi"
          required={required}
          description={description}
        />
      );
    }

    default:
      return null;
  }
}
