"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MagnifyingGlass, Image, Video } from "@/components/ui/icons";
import { AssetCard } from "./AssetCard";
import { GenerationModal } from "./GenerationModal";

interface Asset {
  id: string;
  status: string;
  type: "IMAGE" | "VIDEO";
  model: string;
  prompt: string;
  r2Key: string | null;
  parentId: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface JobsResponse {
  items: Asset[];
  nextCursor: string | null;
}

export function GalleryGrid() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Asset | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAssets = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (cursor && !reset) params.set("cursor", cursor);
      params.set("limit", "20");
      if (typeFilter) params.set("type", typeFilter);
      if (search.length >= 3) params.set("search", search);

      const response = await fetch(`/api/jobs?${params.toString()}`);
      
      if (!response.ok) {
        if (reset) {
          setAssets([]);
        }
        setCursor(null);
        setHasMore(false);
        return;
      }

      const data: JobsResponse = await response.json();

      if (reset) {
        setAssets(data.items ?? []);
      } else {
        setAssets((prev) => [...prev, ...(data.items ?? [])]);
      }
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cursor, typeFilter, search]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchAssets(true);
    }, 300);
    return () => clearTimeout(debounce);
  }, [typeFilter, search]);

  const handleMakeVideo = (asset: Asset) => {
    setSelectedParent(asset);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
    showToast("Asset deleted successfully", "success");
  };

  const handleCancel = (id: string) => {
    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === id ? { ...asset, status: "CANCELLED" } : asset
      )
    );
    showToast("Job cancelled successfully", "success");
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="mc-card aspect-square animate-pulse bg-gradient-to-br from-[#050508] to-[#020306]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8898a5]" />
          <input
            type="text"
            placeholder="Search prompts (min 3 chars)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#050508] border border-white/10 rounded-lg text-[#b8cfdf] placeholder-[#8898a5] focus:outline-none focus:border-[#00e5c9]/50"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTypeFilter(null)}
            className={`px-3 py-1.5 rounded-md text-sm transition-all ${
              !typeFilter ? "bg-[#00e5c9]/20 text-[#00e5c9] border border-[#00e5c9]/30" : "text-[#8898a5] hover:text-[#b8cfdf]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter("IMAGE")}
            className={`px-3 py-1.5 rounded-md text-sm transition-all flex items-center gap-1.5 ${
              typeFilter === "IMAGE" ? "bg-[#4a9eff]/20 text-[#4a9eff] border border-[#4a9eff]/30" : "text-[#8898a5] hover:text-[#b8cfdf]"
            }`}
          >
            <Image className="w-3.5 h-3.5" /> Images
          </button>
          <button
            onClick={() => setTypeFilter("VIDEO")}
            className={`px-3 py-1.5 rounded-md text-sm transition-all flex items-center gap-1.5 ${
              typeFilter === "VIDEO" ? "bg-[#b06aff]/20 text-[#b06aff] border border-[#b06aff]/30" : "text-[#8898a5] hover:text-[#b8cfdf]"
            }`}
          >
            <Video className="w-3.5 h-3.5" /> Videos
          </button>
        </div>
      </div>

      {(!assets || assets.length === 0) ? (
        <div className="mc-card mc-card-teal p-12 text-center">
          <p className="text-[#8898a5] mb-4">No assets yet. Start generating!</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 bg-[#00e5c9]/20 border border-[#00e5c9]/30 text-[#00e5c9] rounded-lg hover:bg-[#00e5c9]/30 transition-all"
          >
            Create your first asset
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onMakeVideo={asset.type === "IMAGE" && asset.status === "COMPLETE" ? () => handleMakeVideo(asset) : undefined}
                  onDelete={handleDelete}
                  onCancel={handleCancel}
                />
              ))}
            </AnimatePresence>
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={() => fetchAssets(false)}
                disabled={loadingMore}
                className="px-6 py-2 bg-white/5 border border-white/10 text-[#b8cfdf] rounded-lg hover:bg-white/10 transition-all disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showModal && (
          <GenerationModal
            onClose={() => {
              setShowModal(false);
              setSelectedParent(null);
            }}
            parentAsset={selectedParent}
          />
        )}
      </AnimatePresence>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg border ${
              toast.type === "success"
                ? "bg-[#00e5c9]/20 border-[#00e5c9]/30 text-[#00e5c9]"
                : "bg-[#ff5240]/20 border-[#ff5240]/30 text-[#ff5240]"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}