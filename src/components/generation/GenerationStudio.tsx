"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DynamicParamForm } from "./DynamicParamForm";
import { useToast } from "@/lib/toast";
import {
  FAL_MODELS,
  getAssetType,
  MODEL_TYPE_LABELS,
  type FalModelConfig,
  type ModelType,
} from "@/lib/fal-client";

// ─── Icons ────────────────────────────────────────────────────────────────────
function SearchIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/></svg>;
}
function WandIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="12" y2="4"/><path d="M12 4L13.5 2.5M8 2l.5.5M14 8l-.5-.5M6 4l.5.5"/><path d="M3 7l1 1M4 13l1-1"/></svg>;
}
function CheckIcon() {
  return <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,7 5.5,11 12,3"/></svg>;
}
function SpinnerIcon() {
  return <svg className="w-5 h-5 animate-spin" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="7" strokeOpacity="0.25"/><path d="M10 3 A7 7 0 0 1 17 10" strokeLinecap="round"/></svg>;
}
function ChevronIcon({ open }: { open: boolean }) {
  return <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="4,6 8,10 12,6"/></svg>;
}
function GalleryIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>;
}

// ─── Model type tabs ──────────────────────────────────────────────────────────
const ALL_TYPES: ModelType[] = [
  "TEXT_TO_IMAGE",
  "IMAGE_TO_IMAGE",
  "TEXT_TO_VIDEO",
  "IMAGE_TO_VIDEO",
  "UPSCALE",
  "IMAGE_EDIT",
  "AUDIO",
  "MUSIC",
];

// ─── Model Card ───────────────────────────────────────────────────────────────
function ModelCard({
  model,
  selected,
  onClick,
}: {
  model: FalModelConfig;
  selected: boolean;
  onClick: () => void;
}) {
  const typeColor: Record<ModelType, string> = {
    TEXT_TO_IMAGE: "text-[#4a9eff]",
    IMAGE_TO_IMAGE: "text-[#00e5c9]",
    TEXT_TO_VIDEO: "text-[#b06aff]",
    IMAGE_TO_VIDEO: "text-[#b06aff]",
    UPSCALE: "text-[#ffbe3c]",
    IMAGE_EDIT: "text-[#3dffa0]",
    AUDIO: "text-[#ff69b4]",
    MUSIC: "text-[#ff69b4]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-3 rounded-xl border transition-all ${
        selected
          ? "border-[#00e5c9]/50 bg-[#00e5c9]/8"
          : "border-transparent hover:border-white/10 hover:bg-white/3"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${selected ? "text-[#d8eaf5]" : "text-[#b8cfdf]"}`}>
            {model.name}
          </p>
          <p className="text-xs text-[#8898a5] truncate mt-0.5">{model.description}</p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          {selected && (
            <span className="w-5 h-5 rounded-full bg-[#00e5c9] flex items-center justify-center text-[#080808]">
              <CheckIcon />
            </span>
          )}
          {model.pricing && (
            <span className="text-[10px] text-[#8898a5] font-mono">{model.pricing}</span>
          )}
        </div>
      </div>
      <span className={`text-[10px] mt-1 block ${typeColor[model.modelType]}`}>
        {model.category}
      </span>
    </button>
  );
}

// ─── GenerationStudio ─────────────────────────────────────────────────────────
interface GenerationStudioProps {
  /** Pre-selected image job ID — from ?inputImage=<jobId> URL param */
  inputJobId?: string | null;
  /** Pre-selected model ID */
  defaultModelId?: string | null;
}

type Step = "configure" | "generating" | "complete" | "error";

export function GenerationStudio({ inputJobId, defaultModelId }: GenerationStudioProps) {
  const { toast } = useToast();

  // Model browser state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<ModelType | "ALL">("ALL");
  const [selectedModelId, setSelectedModelId] = useState<string>(
    defaultModelId ?? FAL_MODELS[0]?.id ?? ""
  );
  const [modelBrowserOpen, setModelBrowserOpen] = useState(false); // mobile accordion

  // Param values
  const [paramValues, setParamValues] = useState<Record<string, unknown>>({});

  // Generation state
  const [step, setStep] = useState<Step>("configure");
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resolve the selected model
  const selectedModel = FAL_MODELS.find((m) => m.id === selectedModelId) ?? null;

  // When model changes, seed default param values
  useEffect(() => {
    if (!selectedModel) return;
    const defaults: Record<string, unknown> = { ...selectedModel.defaultParams };
    for (const p of selectedModel.params) {
      if (p.default !== undefined && !(p.key in defaults)) {
        defaults[p.key] = p.default;
      }
    }
    setParamValues(defaults);
  }, [selectedModelId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill image input from inputJobId
  useEffect(() => {
    if (!inputJobId || !selectedModel) return;
    fetch(`/api/assets?jobId=${inputJobId}`)
      .then((r) => r.json())
      .then(({ url }) => {
        if (url) {
          // Find the first image-upload param and set it
          const imgParam = selectedModel.params.find(
            (p) => p.type === "image-upload" || p.type === "images-upload"
          );
          if (imgParam) {
            setParamValues((prev) => ({
              ...prev,
              [imgParam.key]: imgParam.type === "images-upload" ? [url] : url,
            }));
          }
        }
      })
      .catch(() => {});
  }, [inputJobId, selectedModel]);

  // Filter models for browser
  const filteredModels = FAL_MODELS.filter((m) => {
    const matchesType = activeType === "ALL" || m.modelType === activeType;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  function updateParam(key: string, value: unknown) {
    setParamValues((prev) => ({ ...prev, [key]: value }));
  }

  function selectModel(model: FalModelConfig) {
    setSelectedModelId(model.id);
    setModelBrowserOpen(false); // close accordion on mobile
    setStep("configure");
    setErrorMessage(null);
  }

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Poll for job completion
  useEffect(() => {
    if (step !== "generating" || !jobId) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        if (data.status === "COMPLETE") {
          setStep("complete");
          stopPolling();
          toast("Generation complete!", "success");
        } else if (data.status === "FAL_FAILED" || data.status === "UPLOAD_FAILED") {
          setErrorMessage(data.errorMessage || "Generation failed");
          setStep("error");
          stopPolling();
        } else if (data.status === "CANCELLED") {
          setStep("configure");
          stopPolling();
        }
      } catch {
        // transient network error — keep polling
      }
    }, 3000);
    return stopPolling;
  }, [step, jobId, stopPolling, toast]);

  async function handleGenerate() {
    if (!selectedModel) return;

    // Validate required params
    for (const p of selectedModel.params) {
      if (p.required) {
        const val = paramValues[p.key];
        if (!val || (typeof val === "string" && !val.trim()) || (Array.isArray(val) && val.length === 0)) {
          toast(`"${p.label}" is required`, "error");
          return;
        }
      }
    }

    setStep("generating");
    setErrorMessage(null);

    try {
      // Build request body — map params to expected API shape
      const { prompt, negative_prompt, seed, ...extraParams } = paramValues as Record<string, unknown>;
      const assetType = getAssetType(selectedModel.modelType);

      // Collect all non-prompt/seed params into params object
      const params: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(extraParams)) {
        if (v !== undefined && v !== "" && v !== null) {
          params[k] = v;
        }
      }

      const body: Record<string, unknown> = {
        model: selectedModel.id,
        prompt: typeof prompt === "string" ? prompt : "",
        negativePrompt: typeof negative_prompt === "string" && negative_prompt ? negative_prompt : undefined,
        seed: typeof seed === "number" ? seed : undefined,
        params,
        assetType,
      };

      // image_urls special handling for legacy IMAGE_EDIT models
      if (params.image_urls) {
        body.imageUrls = params.image_urls;
        delete params.image_urls;
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setJobId(data.jobId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setErrorMessage(msg);
      setStep("error");
      toast(msg, "error");
    }
  }

  async function handleCancel() {
    if (!jobId) return;
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
    } catch {
      // ignore
    }
    stopPolling();
    setStep("configure");
    setJobId(null);
    toast("Generation cancelled", "info");
  }

  // Counts for tabs
  const typeCounts: Partial<Record<ModelType, number>> = {};
  for (const m of FAL_MODELS) {
    typeCounts[m.modelType] = (typeCounts[m.modelType] ?? 0) + 1;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ── Desktop: 2-column layout / Mobile: stacked ─── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── LEFT: Model Browser ───────────────────────────── */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0">

          {/* Mobile: collapsible accordion */}
          <div className="lg:hidden mb-4">
            <button
              type="button"
              onClick={() => setModelBrowserOpen(!modelBrowserOpen)}
              className="w-full flex items-center justify-between px-4 py-3 mc-card rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#b8cfdf]">
                  {selectedModel ? selectedModel.name : "Select a model"}
                </span>
                {selectedModel && (
                  <span className="text-xs text-[#8898a5]">{selectedModel.category}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[#8898a5]">
                <span className="text-xs">{FAL_MODELS.length} models</span>
                <ChevronIcon open={modelBrowserOpen} />
              </div>
            </button>
          </div>

          {/* Browser panel */}
          <AnimatePresence>
            {(modelBrowserOpen || true) && ( // always show on desktop
              <motion.div
                initial={false}
                animate={{ height: "auto", opacity: 1 }}
                className={`mc-card rounded-2xl overflow-hidden ${
                  !modelBrowserOpen ? "hidden lg:block" : ""
                }`}
              >
                {/* Search */}
                <div className="p-3 border-b border-white/10">
                  <div className="relative">
                    <SearchIcon />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search models…"
                      className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-[#b8cfdf] placeholder-[#8898a5] focus:outline-none focus:border-[#00e5c9]/50 transition-colors"
                      style={{ paddingLeft: "2rem" }}
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8898a5] pointer-events-none">
                      <SearchIcon />
                    </div>
                  </div>
                </div>

                {/* Type filter tabs — horizontal scroll */}
                <div className="flex gap-1 p-2 overflow-x-auto border-b border-white/10 scrollbar-none">
                  <button
                    onClick={() => setActiveType("ALL")}
                    className={`flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                      activeType === "ALL"
                        ? "bg-white/15 text-[#d8eaf5]"
                        : "text-[#8898a5] hover:text-[#b8cfdf] hover:bg-white/5"
                    }`}
                  >
                    All ({FAL_MODELS.length})
                  </button>
                  {ALL_TYPES.map((t) => {
                    const count = typeCounts[t] ?? 0;
                    if (!count) return null;
                    return (
                      <button
                        key={t}
                        onClick={() => setActiveType(t)}
                        className={`flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                          activeType === t
                            ? "bg-white/15 text-[#d8eaf5]"
                            : "text-[#8898a5] hover:text-[#b8cfdf] hover:bg-white/5"
                        }`}
                      >
                        {MODEL_TYPE_LABELS[t]} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Model list */}
                <div className="overflow-y-auto max-h-[400px] lg:max-h-[calc(100vh-280px)] p-2 space-y-0.5">
                  {filteredModels.length === 0 ? (
                    <p className="text-xs text-[#8898a5] text-center py-6">No models match your search</p>
                  ) : (
                    filteredModels.map((model) => (
                      <ModelCard
                        key={model.id}
                        model={model}
                        selected={model.id === selectedModelId}
                        onClick={() => selectModel(model)}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT: Parameter Form ─────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="mc-card rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-[#d8eaf5] font-['Rajdhani'] truncate">
                  {selectedModel?.name ?? "Select a model"}
                </h1>
                {selectedModel && (
                  <p className="text-xs text-[#8898a5] mt-0.5">
                    {MODEL_TYPE_LABELS[selectedModel.modelType]}
                    {selectedModel.pricing && ` · ${selectedModel.pricing}`}
                  </p>
                )}
              </div>
              {selectedModel && (
                <span className="text-xs text-[#8898a5] ml-4 flex-shrink-0">
                  {selectedModel.params.length} parameters
                </span>
              )}
            </div>

            {/* Form body */}
            <div className="p-5">
              {!selectedModel ? (
                <div className="py-16 text-center">
                  <p className="text-[#8898a5]">Choose a model from the list to get started.</p>
                </div>
              ) : step === "configure" || step === "error" ? (
                <>
                  <DynamicParamForm
                    params={selectedModel.params}
                    values={paramValues}
                    onChange={updateParam}
                  />
                  {errorMessage && (
                    <div className="mt-4 p-3 bg-[#ff5240]/10 border border-[#ff5240]/20 rounded-xl text-[#ff5240] text-sm">
                      {errorMessage}
                    </div>
                  )}
                </>
              ) : step === "generating" ? (
                <div className="py-16 text-center space-y-4">
                  <div className="flex justify-center">
                    <SpinnerIcon />
                  </div>
                  <div>
                    <p className="text-[#d8eaf5] font-medium">Generating…</p>
                    <p className="text-sm text-[#8898a5] mt-1">
                      This may take a minute. You can close and check the gallery.
                    </p>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm text-[#8898a5] hover:text-[#b8cfdf] border border-white/10 rounded-lg hover:border-white/20 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : step === "complete" ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#00e5c9]/20 flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#00e5c9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4,12 9,17 20,6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#d8eaf5] font-medium">Generation complete!</p>
                    <p className="text-sm text-[#8898a5] mt-1">Your asset is saved in the gallery.</p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <a
                      href="/gallery"
                      className="flex items-center gap-2 px-4 py-2 bg-[#00e5c9]/15 border border-[#00e5c9]/30 text-[#00e5c9] rounded-lg hover:bg-[#00e5c9]/25 transition-all text-sm"
                    >
                      <GalleryIcon />
                      View Gallery
                    </a>
                    <button
                      onClick={() => { setStep("configure"); setJobId(null); }}
                      className="px-4 py-2 bg-white/5 border border-white/10 text-[#b8cfdf] rounded-lg hover:bg-white/10 transition-all text-sm"
                    >
                      Generate Again
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer — Generate button */}
            {selectedModel && (step === "configure" || step === "error") && (
              <div className="px-5 pb-5 border-t border-white/10 pt-4 flex justify-end gap-3">
                <button
                  onClick={() => { setStep("configure"); setErrorMessage(null); }}
                  className={`px-4 py-2.5 text-sm text-[#8898a5] hover:text-[#b8cfdf] transition-colors ${step === "configure" ? "hidden" : ""}`}
                >
                  Reset
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#00e5c9] text-[#080808] font-semibold rounded-xl hover:bg-[#00e5c9]/90 active:scale-[0.98] transition-all text-sm"
                >
                  <WandIcon />
                  Generate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
