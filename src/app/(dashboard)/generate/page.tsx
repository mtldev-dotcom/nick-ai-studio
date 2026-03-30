"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "@/components/ui/icons";
import { GenerationModal } from "@/components/GenerationModal";

export default function GeneratePage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-4 py-8">
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00e5c9]/20 to-[#4a9eff]/20 border border-[#00e5c9]/20 mb-6"
        >
          <Sparkles className="w-10 h-10 text-[#00e5c9]" />
        </motion.div>
        <h1 className="text-3xl font-bold text-[#d8eaf5] font-['Rajdhani'] mb-2">
          Create Something Amazing
        </h1>
        <p className="text-[#8898a5] max-w-md mx-auto">
          Generate stunning images and videos with Fal.ai models. All assets are automatically saved to your R2 bucket.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mc-card mc-card-blue p-6 cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => {
            (window as unknown as { __setAssetType?: (t: string) => void }).__setAssetType = () => {};
            setShowModal(true);
          }}
        >
          <div className="w-12 h-12 rounded-xl bg-[#4a9eff]/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-[#4a9eff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#d8eaf5] mb-2">Text to Image</h3>
          <p className="text-sm text-[#8898a5]">
            Create stunning images with Flux 1.0 Pro, Flux 1.0 Dev, or SDXL models.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mc-card mc-card-purple p-6 cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => setShowModal(true)}
        >
          <div className="w-12 h-12 rounded-xl bg-[#b06aff]/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-[#b06aff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#d8eaf5] mb-2">Image to Video</h3>
          <p className="text-sm text-[#8898a5]">
            Transform existing images into smooth videos using Stable Video Diffusion.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mc-card mc-card-teal p-6"
      >
        <h3 className="text-lg font-semibold text-[#d8eaf5] mb-4">Quick Actions</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <button
            onClick={() => setShowModal(true)}
            className="p-4 bg-[#050508] rounded-lg border border-white/10 hover:border-[#00e5c9]/30 transition-all text-left"
          >
            <span className="text-sm text-[#b8cfdf]">New Image Generation</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="p-4 bg-[#050508] rounded-lg border border-white/10 hover:border-[#b06aff]/30 transition-all text-left"
          >
            <span className="text-sm text-[#b8cfdf]">New Video Generation</span>
          </button>
          <button
            onClick={() => window.location.href = "/gallery"}
            className="p-4 bg-[#050508] rounded-lg border border-white/10 hover:border-white/20 transition-all text-left"
          >
            <span className="text-sm text-[#b8cfdf]">Browse Gallery</span>
          </button>
        </div>
      </motion.div>

      {showModal && (
        <GenerationModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
