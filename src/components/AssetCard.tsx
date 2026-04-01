"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, AlertCircle, Clock, ChevronRight, Video, Trash, Copy, Download } from "@/components/ui/icons";

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

interface AssetCardProps {
  asset: Asset;
  onMakeVideo?: () => void;
  onDelete?: (id: string) => void;
}

export function AssetCard({ asset, onMakeVideo, onDelete }: AssetCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (asset.status === "COMPLETE" && asset.r2Key) {
      fetch(`/api/assets?jobId=${asset.id}`)
        .then((res) => res.json())
        .then((data) => setImageUrl(data.url))
        .catch(console.error);
    }
  }, [asset.id, asset.status, asset.r2Key]);

  const statusColors: Record<string, string> = {
    PENDING: "bg-[#ffbe3c]/20 text-[#ffbe3c] border-[#ffbe3c]/30",
    PROCESSING: "bg-[#4a9eff]/20 text-[#4a9eff] border-[#4a9eff]/30",
    COMPLETE: "bg-[#00e5c9]/20 text-[#00e5c9] border-[#00e5c9]/30",
    UPLOAD_FAILED: "bg-[#ff5240]/20 text-[#ff5240] border-[#ff5240]/30",
    FAL_FAILED: "bg-[#ff5240]/20 text-[#ff5240] border-[#ff5240]/30",
    CANCELLED: "bg-[#8898a5]/20 text-[#8898a5] border-[#8898a5]/30",
  };

  const typeColors: Record<string, string> = {
    IMAGE: "mc-card-blue",
    VIDEO: "mc-card-purple",
  };

  const getStatusIcon = () => {
    switch (asset.status) {
      case "PROCESSING":
      case "PENDING":
        return <Clock className="w-4 h-4 animate-spin" />;
      case "FAL_FAILED":
      case "UPLOAD_FAILED":
        return <AlertCircle className="w-4 h-4" />;
      case "COMPLETE":
        return <Play className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/jobs/${asset.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        onDelete(asset.id);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleting(false);
      setContextMenu(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(asset.prompt);
    setContextMenu(false);
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${asset.id}.${asset.type === "VIDEO" ? "mp4" : "png"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setContextMenu(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`mc-card ${typeColors[asset.type]} relative group overflow-hidden cursor-pointer`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu(true);
      }}
    >
      <div className="aspect-square bg-gradient-to-br from-[#050508] to-[#020306] relative">
        {asset.status === "COMPLETE" && imageUrl ? (
          <>
            {asset.type === "VIDEO" ? (
              <video
                src={imageUrl}
                muted
                loop
                playsInline
                className={`w-full h-full object-cover transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-50"}`}
                poster={imageUrl}
              />
            ) : (
              <img
                src={imageUrl}
                alt={asset.prompt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
          </>
        ) : asset.status === "FAILED" || asset.status === "FAL_FAILED" ? (
          <div className="w-full h-full flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-[#ff5240]/50" />
          </div>
        ) : (
          <div className="w-full h-full animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#4a9eff]/30 border-t-[#4a9eff] animate-spin" />
          </div>
        )}

        <div className="absolute top-2 left-2">
          <span className={`px-2 py-0.5 rounded-full text-xs border flex items-center gap-1 ${statusColors[asset.status]}`}>
            {getStatusIcon()}
            {asset.status}
          </span>
        </div>

        {asset.parentId && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 rounded-full text-xs bg-[#b06aff]/20 text-[#b06aff] border border-[#b06aff]/30 flex items-center gap-1">
              <ChevronRight className="w-3 h-3" /> From image
            </span>
          </div>
        )}

        {asset.status === "COMPLETE" && (
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}>
            <div className="flex gap-2">
              {asset.type === "IMAGE" && onMakeVideo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMakeVideo();
                  }}
                  className="px-3 py-1.5 bg-[#b06aff]/80 rounded-md text-xs text-white hover:bg-[#b06aff] transition-colors flex items-center gap-1"
                >
                  <Video className="w-3 h-3" /> Make Video
                </button>
              )}
              {imageUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  className="px-3 py-1.5 bg-[#00e5c9]/80 rounded-md text-xs text-white hover:bg-[#00e5c9] transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/5">
        <p className="text-xs text-[#8898a5] truncate">{asset.prompt}</p>
        <p className="text-xs text-[#8898a5]/50 mt-1">{asset.model}</p>
      </div>

      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(false)}
          />
          <div
            className="fixed z-50 mc-card mc-card-purple p-2 min-w-[160px]"
            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-3 py-2 text-left text-sm text-[#b8cfdf] hover:bg-white/10 rounded transition-colors flex items-center gap-2"
              onClick={handleCopyPrompt}
            >
              <Copy className="w-4 h-4" /> Copy prompt
            </button>
            {asset.type === "IMAGE" && onMakeVideo && (
              <button
                className="w-full px-3 py-2 text-left text-sm text-[#b06aff] hover:bg-white/10 rounded transition-colors flex items-center gap-2"
                onClick={() => {
                  onMakeVideo();
                  setContextMenu(false);
                }}
              >
                <Video className="w-4 h-4" /> Make Video
              </button>
            )}
            {imageUrl && (
              <button
                className="w-full px-3 py-2 text-left text-sm text-[#00e5c9] hover:bg-white/10 rounded transition-colors flex items-center gap-2"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" /> Download
              </button>
            )}
            {onDelete && (
              <button
                className="w-full px-3 py-2 text-left text-sm text-[#ff5240] hover:bg-white/10 rounded transition-colors flex items-center gap-2 disabled:opacity-50"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash className="w-4 h-4" /> {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
            <button
              className="w-full px-3 py-2 text-left text-sm text-[#8898a5] hover:bg-white/10 rounded transition-colors"
              onClick={() => setContextMenu(false)}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}