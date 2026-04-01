"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Wand, Loader, Image, Video, Check } from "@/components/ui/icons";
import { getModelsByTypeClient, getModelByIdClient, type FalModelConfigClient } from "@/lib/fal-client";

interface GenerationModalProps {
  onClose: () => void;
  parentAsset?: {
    id: string;
    r2Key: string | null;
    prompt: string;
  } | null;
}

export function GenerationModal({ onClose, parentAsset }: GenerationModalProps) {
  const [step, setStep] = useState<"configure" | "generating" | "complete">("configure");
  const [assetType, setAssetType] = useState<"IMAGE" | "VIDEO">(parentAsset ? "VIDEO" : "IMAGE");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [prompt, setPrompt] = useState(parentAsset?.prompt || "");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const models = getModelsByTypeClient(assetType);
  const categories = [...new Set(models.map((m) => m.category))];

  // Filter models by selected category
  const filteredModels = selectedCategory
    ? models.filter((m) => m.category === selectedCategory)
    : models;

  useEffect(() => {
    // Reset category and model when type changes
    setSelectedCategory("");
    setSelectedModel("");
  }, [assetType]);

  useEffect(() => {
    // Auto-select first model when category changes
    if (filteredModels.length > 0 && !selectedModel) {
      setSelectedModel(filteredModels[0].id);
    }
  }, [filteredModels, selectedModel]);

  useEffect(() => {
    if (step === "generating" && jobId) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/jobs/${jobId}`);
          const data = await response.json();
          
          if (data.status === "COMPLETE") {
            setStep("complete");
            clearInterval(pollInterval);
          } else if (data.status === "FAL_FAILED" || data.status === "UPLOAD_FAILED") {
            setError(data.errorMessage || "Generation failed");
            clearInterval(pollInterval);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000);

      return () => clearInterval(pollInterval);
    }
  }, [step, jobId]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Prompt is required");
      return;
    }

    setStep("generating");
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          prompt,
          negativePrompt: negativePrompt || undefined,
          seed,
          parentId: parentAsset?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setJobId(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setStep("configure");
    }
  };

  const selectedModelInfo = getModelByIdClient(selectedModel);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="mc-card mc-card-teal w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-[#d8eaf5] font-['Rajdhani']">
            {parentAsset ? "Generate Video from Image" : "Generate Asset"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[#8898a5] hover:text-[#b8cfdf] hover:bg-white/5 rounded-md transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {parentAsset && (
            <div className="p-4 bg-[#b06aff]/10 border border-[#b06aff]/20 rounded-lg">
              <p className="text-sm text-[#b06aff] flex items-center gap-2">
                <Image className="w-4 h-4" />
                Using image as reference for video generation
              </p>
            </div>
          )}

          {step === "configure" && (
            <>
              <div className="space-y-4">
                {/* Asset Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-[#b8cfdf] mb-2">
                    Asset Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAssetType("IMAGE")}
                      className={`flex-1 p-4 rounded-lg border transition-all ${
                        assetType === "IMAGE"
                          ? "bg-[#4a9eff]/20 border-[#4a9eff]/50 text-[#4a9eff]"
                          : "bg-[#050508] border-white/10 text-[#8898a5] hover:border-white/20"
                      }`}
                    >
                      <Image className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-medium">Image</span>
                    </button>
                    <button
                      onClick={() => setAssetType("VIDEO")}
                      className={`flex-1 p-4 rounded-lg border transition-all ${
                        assetType === "VIDEO"
                          ? "bg-[#b06aff]/20 border-[#b06aff]/50 text-[#b06aff]"
                          : "bg-[#050508] border-white/10 text-[#8898a5] hover:border-white/20"
                      }`}
                    >
                      <Video className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-medium">Video</span>
                    </button>
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-[#b8cfdf] mb-2">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
                          setSelectedModel("");
                        }}
                        className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                          selectedCategory === category
                            ? "bg-[#00e5c9]/20 text-[#00e5c9] border border-[#00e5c9]/30"
                            : "text-[#8898a5] hover:text-[#b8cfdf] border border-white/10 hover:border-white/20"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-[#b8cfdf] mb-2">
                    Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-4 py-3 bg-[#050508] border border-white/10 rounded-lg text-[#b8cfdf] focus:outline-none focus:border-[#00e5c9]/50"
                  >
                    {filteredModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} {model.pricing ? `(${model.pricing})` : ""}
                      </option>
                    ))}
                  </select>
                  {selectedModelInfo && (
                    <p className="text-xs text-[#8898a5] mt-2">
                      {selectedModelInfo.description}
                    </p>
                  )}
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-sm font-medium text-[#b8cfdf] mb-2">
                    Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to generate..."
                    rows={4}
                    className="w-full px-4 py-3 bg-[#050508] border border-white/10 rounded-lg text-[#b8cfdf] placeholder-[#8898a5] focus:outline-none focus:border-[#00e5c9]/50 resize-none"
                  />
                </div>

                {/* Negative Prompt */}
                <div>
                  <label className="block text-sm font-medium text-[#b8cfdf] mb-2">
                    Negative Prompt (optional)
                  </label>
                  <textarea
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="What to avoid..."
                    rows={2}
                    className="w-full px-4 py-3 bg-[#050508] border border-white/10 rounded-lg text-[#b8cfdf] placeholder-[#8898a5] focus:outline-none focus:border-[#00e5c9]/50 resize-none"
                  />
                </div>

                {/* Seed */}
                <div>
                  <label className="block text-sm font-medium text-[#b8cfdf] mb-2">
                    Seed (optional)
                  </label>
                  <input
                    type="number"
                    value={seed || ""}
                    onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="For reproducibility..."
                    className="w-full px-4 py-3 bg-[#050508] border border-white/10 rounded-lg text-[#b8cfdf] placeholder-[#8898a5] focus:outline-none focus:border-[#00e5c9]/50"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-[#ff5240]/10 border border-[#ff5240]/20 rounded-lg text-[#ff5240] text-sm">
                  {error}
                </div>
              )}
            </>
          )}

          {step === "generating" && (
            <div className="py-12 text-center">
              <Loader className="w-12 h-12 mx-auto mb-4 text-[#00e5c9]" />
              <h3 className="text-lg font-medium text-[#d8eaf5] mb-2">Generating...</h3>
              <p className="text-sm text-[#8898a5]">
                This may take a few minutes. You can close this modal and check the gallery.
              </p>
            </div>
          )}

          {step === "complete" && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00e5c9]/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-[#00e5c9]" />
              </div>
              <h3 className="text-lg font-medium text-[#d8eaf5] mb-2">Generation Complete!</h3>
              <p className="text-sm text-[#8898a5] mb-6">
                Your asset has been saved to your R2 bucket.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#00e5c9]/20 border border-[#00e5c9]/30 text-[#00e5c9] rounded-lg hover:bg-[#00e5c9]/30 transition-all"
              >
                View in Gallery
              </button>
            </div>
          )}
        </div>

        {step === "configure" && (
          <div className="p-6 border-t border-white/10 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[#8898a5] hover:text-[#b8cfdf] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="px-6 py-2 bg-[#00e5c9] text-[#080808] font-medium rounded-lg hover:bg-[#00e5c9]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Wand className="w-4 h-4" />
              Generate
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}