"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { MagnifyingGlass, Image, Video } from "@/components/ui/icons";
import { AssetCard } from "./AssetCard";
import { useToast } from "@/lib/toast";
import { useRouter } from "next/navigation";

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
  const { toast } = useToast();
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

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
        if (reset) setAssets([]);
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
  }, [typeFilter, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUseAsInput = (asset: Asset) => {
    router.push(`/generate?inputImage=${asset.id}`);
  };

  const handleDelete = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    toast("Asset deleted", "success");
  };

  const handleCancel = (id: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "CANCELLED" } : a))
    );
    toast("Job cancelled", "info");
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="mc-card aspect-square animate-pulse bg-gradient-to-br from-[#050508] to-[#020306] rounded-2xl"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8898a5] pointer-events-none">
            <MagnifyingGlass className="w-4 h-4" />
          </div>
          <input
            type="search"
            placeholder="Search prompts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#050508] border border-white/10 rounded-xl text-sm text-[#b8cfdf] placeholder-[#8898a5] focus:outline-none focus:border-[#00e5c9]/50 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {[
            { label: "All", value: null, color: "text-[#00e5c9] bg-[#00e5c9]/20 border-[#00e5c9]/30" },
            { label: "Images", value: "IMAGE", color: "text-[#4a9eff] bg-[#4a9eff]/20 border-[#4a9eff]/30", Icon: Image },
            { label: "Videos", value: "VIDEO", color: "text-[#b06aff] bg-[#b06aff]/20 border-[#b06aff]/30", Icon: Video },
          ].map(({ label, value, color, Icon }) => (
            <button
              key={label}
              onClick={() => setTypeFilter(value)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 min-h-[40px] ${
                typeFilter === value
                  ? `${color} border`
                  : "text-[#8898a5] hover:text-[#b8cfdf] border border-white/10 hover:border-white/20"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {assets.length === 0 ? (
        <div className="mc-card mc-card-teal p-12 text-center rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#00e5c9]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#00e5c9]/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
          </div>
          <p className="text-[#8898a5] mb-4">No assets yet. Start generating!</p>
          <a
            href="/generate"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00e5c9]/20 border border-[#00e5c9]/30 text-[#00e5c9] rounded-xl hover:bg-[#00e5c9]/30 transition-all text-sm font-medium"
          >
            Create your first asset
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            <AnimatePresence mode="popLayout">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onUseAsInput={
                    asset.type === "IMAGE" && asset.status === "COMPLETE"
                      ? () => handleUseAsInput(asset)
                      : undefined
                  }
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
                className="px-6 py-2.5 bg-white/5 border border-white/10 text-[#b8cfdf] rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 text-sm"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
