"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface GalleryAsset {
  id: string;
  prompt: string;
  url: string | null;
}

interface AssetPickerProps {
  /** Currently selected URL(s) */
  value: string | string[] | null;
  /** Called with new URL or URL[] when selection changes */
  onChange: (value: string | string[]) => void;
  /** Single image or multiple */
  mode?: "single" | "multi";
  label?: string;
  required?: boolean;
  description?: string;
}

function UploadIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13V4M10 4L7 7M10 4L13 7" />
      <path d="M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="2" y1="2" x2="10" y2="10" /><line x1="10" y1="2" x2="2" y2="10" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2.5,8 6,12 13.5,4" />
    </svg>
  );
}

export function AssetPicker({ value, onChange, mode = "single", label, required, description }: AssetPickerProps) {
  const [tab, setTab] = useState<"upload" | "gallery">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [galleryAssets, setGalleryAssets] = useState<GalleryAsset[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedUrls: string[] = value
    ? Array.isArray(value) ? value : [value]
    : [];

  // Fetch gallery when tab opens
  useEffect(() => {
    if (tab !== "gallery" || galleryAssets.length > 0) return;
    setGalleryLoading(true);
    fetch("/api/jobs?type=IMAGE&status=COMPLETE&limit=50")
      .then((r) => r.json())
      .then(async (data) => {
        const items: GalleryAsset[] = [];
        for (const job of data.items ?? []) {
          // Fetch presigned URL for each
          try {
            const assetRes = await fetch(`/api/assets?jobId=${job.id}`);
            if (assetRes.ok) {
              const { url } = await assetRes.json();
              items.push({ id: job.id, prompt: job.prompt, url });
            }
          } catch {
            // skip failed items
          }
        }
        setGalleryAssets(items);
      })
      .catch(() => {})
      .finally(() => setGalleryLoading(false));
  }, [tab, galleryAssets.length]);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are supported");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File must be under 10MB");
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/assets/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      selectUrl(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function selectUrl(url: string) {
    if (mode === "single") {
      onChange(url);
    } else {
      if (selectedUrls.includes(url)) return;
      onChange([...selectedUrls, url]);
    }
  }

  function removeUrl(url: string) {
    if (mode === "single") {
      onChange("");
    } else {
      const next = selectedUrls.filter((u) => u !== url);
      onChange(next);
    }
  }

  function toggleGalleryItem(url: string) {
    if (mode === "single") {
      onChange(url);
    } else {
      if (selectedUrls.includes(url)) {
        onChange(selectedUrls.filter((u) => u !== url));
      } else {
        onChange([...selectedUrls, url]);
      }
    }
  }

  // Drag and drop
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-[#b8cfdf]">
          {label}
          {required && <span className="text-[#ff5240] ml-1">*</span>}
        </label>
      )}

      {/* Selected previews */}
      {selectedUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedUrls.map((url) => (
            <div key={url} className="relative group w-16 h-16 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Selected" className="w-full h-full object-cover rounded-lg border border-white/10" />
              <button
                type="button"
                onClick={() => removeUrl(url)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#ff5240] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab selector */}
      <div className="flex border border-white/10 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            tab === "upload" ? "bg-white/10 text-[#d8eaf5]" : "text-[#8898a5] hover:text-[#b8cfdf]"
          }`}
        >
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setTab("gallery")}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            tab === "gallery" ? "bg-white/10 text-[#d8eaf5]" : "text-[#8898a5] hover:text-[#b8cfdf]"
          }`}
        >
          From Gallery
        </button>
      </div>

      {/* Upload tab */}
      {tab === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`w-full p-6 border-2 border-dashed rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all ${
            isDragging
              ? "border-[#00e5c9]/60 bg-[#00e5c9]/5"
              : "border-white/20 hover:border-[#00e5c9]/40 hover:bg-[#00e5c9]/5"
          } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <UploadIcon />
          <p className="text-sm text-[#b8cfdf]">
            {isUploading ? "Uploading…" : "Drop image here or tap to browse"}
          </p>
          <p className="text-xs text-[#8898a5]">JPG, PNG, WebP, GIF · max 10 MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Gallery tab */}
      {tab === "gallery" && (
        <div className="border border-white/10 rounded-xl overflow-hidden">
          {galleryLoading ? (
            <div className="p-6 text-center text-sm text-[#8898a5]">Loading gallery…</div>
          ) : galleryAssets.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#8898a5]">
              No completed images yet. Generate some first!
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 p-1 max-h-64 overflow-y-auto">
              {galleryAssets.map((asset) => {
                if (!asset.url) return null;
                const isSelected = selectedUrls.includes(asset.url);
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => toggleGalleryItem(asset.url!)}
                    title={asset.prompt}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected ? "border-[#00e5c9]" : "border-transparent hover:border-white/30"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset.url} alt={asset.prompt} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#00e5c9]/20 flex items-center justify-center">
                        <div className="w-6 h-6 bg-[#00e5c9] rounded-full flex items-center justify-center text-[#080808]">
                          <CheckIcon />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-[#ff5240]">{uploadError}</p>
      )}
      {description && !uploadError && (
        <p className="text-xs text-[#8898a5]">{description}</p>
      )}
    </div>
  );
}
