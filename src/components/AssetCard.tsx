"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, AlertCircle, Clock, ChevronRight, Video, Trash, Copy, Download, X } from "@/components/ui/icons";
import { useToast } from "@/lib/toast";

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
  /** Navigate to /generate with this image as input */
  onUseAsInput?: () => void;
  /** Legacy: open video generation modal */
  onMakeVideo?: () => void;
  onDelete?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:      "bg-[#ffbe3c]/20 text-[#ffbe3c] border-[#ffbe3c]/30",
  PROCESSING:   "bg-[#4a9eff]/20 text-[#4a9eff] border-[#4a9eff]/30",
  COMPLETE:     "bg-[#00e5c9]/20 text-[#00e5c9] border-[#00e5c9]/30",
  UPLOAD_FAILED:"bg-[#ff5240]/20 text-[#ff5240] border-[#ff5240]/30",
  FAL_FAILED:   "bg-[#ff5240]/20 text-[#ff5240] border-[#ff5240]/30",
  CANCELLED:    "bg-[#8898a5]/20 text-[#8898a5] border-[#8898a5]/30",
};

const TYPE_CARD: Record<string, string> = {
  IMAGE: "mc-card-blue",
  VIDEO: "mc-card-purple",
};

export function AssetCard({ asset, onUseAsInput, onMakeVideo, onDelete, onCancel }: AssetCardProps) {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState(false);
  const [preview, setPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (asset.status === "COMPLETE" && asset.r2Key) {
      fetch(`/api/assets?jobId=${asset.id}`)
        .then((r) => r.json())
        .then((d) => setImageUrl(d.url))
        .catch(console.error);
    }
  }, [asset.id, asset.status, asset.r2Key]);

  // ESC to close preview
  useEffect(() => {
    if (!preview) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPreview(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  // Long-press for mobile context menu
  function onTouchStart() {
    longPressTimer.current = setTimeout(() => setContextMenu(true), 500);
  }
  function onTouchEnd() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs/${asset.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(asset.id);
      } else {
        toast("Delete failed", "error");
      }
    } catch {
      toast("Delete failed", "error");
    } finally {
      setDeleting(false);
      setContextMenu(false);
    }
  }

  async function handleCancel() {
    if (!onCancel) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/jobs/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        onCancel(asset.id);
      } else {
        toast("Cancel failed", "error");
      }
    } catch {
      toast("Cancel failed", "error");
    } finally {
      setCancelling(false);
      setContextMenu(false);
    }
  }

  function handleCopyPrompt() {
    navigator.clipboard.writeText(asset.prompt).then(() => toast("Prompt copied", "success"));
    setContextMenu(false);
  }

  async function handleDownload() {
    try {
      const res = await fetch(`/api/assets/download?jobId=${asset.id}`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${asset.id}.${asset.type === "VIDEO" ? "mp4" : "jpg"}`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Download started", "success");
    } catch {
      toast("Download failed", "error");
    }
    setContextMenu(false);
  }

  const isPending   = asset.status === "PENDING" || asset.status === "PROCESSING";
  const isFailed    = asset.status === "FAL_FAILED" || asset.status === "UPLOAD_FAILED";
  const isCancelled = asset.status === "CANCELLED";
  const isComplete  = asset.status === "COMPLETE";

  function StatusIcon() {
    if (isPending) return <Clock className="w-3.5 h-3.5 animate-spin" />;
    if (isFailed)  return <AlertCircle className="w-3.5 h-3.5" />;
    if (isComplete) return <Play className="w-3.5 h-3.5" />;
    return null;
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className={`mc-card ${TYPE_CARD[asset.type] ?? ""} relative group overflow-hidden rounded-2xl cursor-pointer`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onContextMenu={(e) => { e.preventDefault(); setContextMenu(true); }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchEnd}
        onClick={() => { if (isComplete && imageUrl && !contextMenu) setPreview(true); }}
      >
        {/* Thumbnail */}
        <div className="aspect-square bg-gradient-to-br from-[#050508] to-[#020306] relative overflow-hidden">
          {isComplete && imageUrl ? (
            asset.type === "VIDEO" ? (
              <video
                src={imageUrl}
                muted loop playsInline
                className={`w-full h-full object-cover transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-60"}`}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt={asset.prompt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )
          ) : isFailed ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-3">
              <AlertCircle className="w-8 h-8 text-[#ff5240]/50" />
              {asset.errorMessage && (
                <p className="text-[10px] text-[#ff5240]/70 text-center line-clamp-2">{asset.errorMessage}</p>
              )}
            </div>
          ) : isCancelled ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-3">
              <X className="w-8 h-8 text-[#8898a5]/40" />
              <p className="text-[10px] text-[#8898a5]/50 text-center">Cancelled</p>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-[#4a9eff]/30 border-t-[#4a9eff] animate-spin" />
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] border flex items-center gap-1 ${STATUS_COLORS[asset.status] ?? ""}`}>
              <StatusIcon />
              {asset.status.replace("_", " ")}
            </span>
          </div>

          {/* "From image" badge */}
          {asset.parentId && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#b06aff]/20 text-[#b06aff] border border-[#b06aff]/30 flex items-center gap-0.5">
                <ChevronRight className="w-3 h-3" />From image
              </span>
            </div>
          )}

          {/* Hover action overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5 gap-1.5 flex-wrap transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {isPending && onCancel && (
              <ActionButton onClick={(e) => { e.stopPropagation(); handleCancel(); }} disabled={cancelling} color="red">
                <X className="w-3 h-3" />{cancelling ? "…" : "Cancel"}
              </ActionButton>
            )}
            {isComplete && asset.type === "IMAGE" && onUseAsInput && (
              <ActionButton onClick={(e) => { e.stopPropagation(); onUseAsInput(); }} color="teal">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6h8M6 2l4 4-4 4"/></svg>
                Use as Input
              </ActionButton>
            )}
            {isComplete && asset.type === "IMAGE" && onMakeVideo && (
              <ActionButton onClick={(e) => { e.stopPropagation(); onMakeVideo(); }} color="purple">
                <Video className="w-3 h-3" />Video
              </ActionButton>
            )}
            {isComplete && imageUrl && (
              <ActionButton onClick={(e) => { e.stopPropagation(); handleDownload(); }} color="teal">
                <Download className="w-3 h-3" />
              </ActionButton>
            )}
            {onDelete && (
              <ActionButton onClick={(e) => { e.stopPropagation(); handleDelete(); }} disabled={deleting} color="red">
                <Trash className="w-3 h-3" />{deleting ? "…" : "Delete"}
              </ActionButton>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5">
          <p className="text-xs text-[#8898a5] truncate leading-snug">{asset.prompt}</p>
          <p className="text-[10px] text-[#8898a5]/50 mt-0.5 truncate">{asset.model}</p>
        </div>

        {/* Context menu */}
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setContextMenu(false)} />
            <div
              className="fixed z-50 mc-card mc-card-purple p-1.5 min-w-[170px] rounded-xl shadow-2xl"
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {isComplete && imageUrl && (
                <ContextMenuItem onClick={() => { setContextMenu(false); setPreview(true); }}>
                  <Play className="w-4 h-4" />Preview
                </ContextMenuItem>
              )}
              <ContextMenuItem onClick={handleCopyPrompt}>
                <Copy className="w-4 h-4" />Copy prompt
              </ContextMenuItem>
              {isComplete && asset.type === "IMAGE" && onUseAsInput && (
                <ContextMenuItem onClick={() => { setContextMenu(false); onUseAsInput(); }} color="teal">
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 8h12M8 2l6 6-6 6"/></svg>
                  Use as Input
                </ContextMenuItem>
              )}
              {isComplete && asset.type === "IMAGE" && onMakeVideo && (
                <ContextMenuItem onClick={() => { setContextMenu(false); onMakeVideo(); }} color="purple">
                  <Video className="w-4 h-4" />Make Video
                </ContextMenuItem>
              )}
              {imageUrl && (
                <ContextMenuItem onClick={handleDownload} color="teal">
                  <Download className="w-4 h-4" />Download
                </ContextMenuItem>
              )}
              {isPending && onCancel && (
                <ContextMenuItem onClick={handleCancel} color="red" disabled={cancelling}>
                  <X className="w-4 h-4" />{cancelling ? "Cancelling…" : "Cancel Job"}
                </ContextMenuItem>
              )}
              {onDelete && (
                <ContextMenuItem onClick={handleDelete} color="red" disabled={deleting}>
                  <Trash className="w-4 h-4" />{deleting ? "Deleting…" : "Delete"}
                </ContextMenuItem>
              )}
              <ContextMenuItem onClick={() => setContextMenu(false)}>
                Close
              </ContextMenuItem>
            </div>
          </>
        )}
      </motion.div>

      {/* Preview modal — portalled to body */}
      {typeof window !== "undefined" && createPortal(
        <AnimatePresence>
          {preview && imageUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-8"
              onClick={() => setPreview(false)}
            >
              {/* Close button */}
              <button
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                onClick={() => setPreview(false)}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Action bar */}
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />Download
                </button>
                {asset.type === "IMAGE" && onUseAsInput && (
                  <button
                    onClick={() => { setPreview(false); onUseAsInput(); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00e5c9]/20 hover:bg-[#00e5c9]/30 text-[#00e5c9] text-sm transition-colors border border-[#00e5c9]/30"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 8h12M8 2l6 6-6 6"/></svg>
                    Use as Input
                  </button>
                )}
              </div>

              {/* Media */}
              <motion.div
                initial={{ scale: 0.94 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.94 }}
                transition={{ duration: 0.18 }}
                className="max-w-full max-h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {asset.type === "VIDEO" ? (
                  <video
                    src={imageUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="max-w-[90vw] max-h-[80vh] rounded-xl shadow-2xl"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageUrl}
                    alt={asset.prompt}
                    className="max-w-[90vw] max-h-[80vh] rounded-xl shadow-2xl object-contain"
                  />
                )}
              </motion.div>

              {/* Prompt caption */}
              <div
                className="absolute bottom-16 left-1/2 -translate-x-1/2 max-w-xl w-full px-4 text-center pointer-events-none"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs text-[#8898a5] truncate">{asset.prompt}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ActionButton({
  onClick,
  disabled,
  color = "teal",
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  color?: "teal" | "purple" | "red";
  children: React.ReactNode;
}) {
  const colors = {
    teal:   "bg-[#00e5c9]/80 hover:bg-[#00e5c9]",
    purple: "bg-[#b06aff]/80 hover:bg-[#b06aff]",
    red:    "bg-[#ff5240]/80 hover:bg-[#ff5240]",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-white font-medium transition-colors disabled:opacity-50 min-h-[32px] ${colors[color]}`}
    >
      {children}
    </button>
  );
}

function ContextMenuItem({
  onClick,
  disabled,
  color,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  color?: "teal" | "purple" | "red";
  children: React.ReactNode;
}) {
  const textColor = color === "teal" ? "text-[#00e5c9]" : color === "purple" ? "text-[#b06aff]" : color === "red" ? "text-[#ff5240]" : "text-[#b8cfdf]";
  return (
    <button
      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 min-h-[44px] ${textColor}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
