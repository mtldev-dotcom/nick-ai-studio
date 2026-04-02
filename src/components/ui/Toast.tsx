"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContext, type Toast, type ToastType } from "@/lib/toast";

// Icons inline to avoid extra deps
function CheckIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2.5,8 6,12 13.5,4" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="3" x2="13" y2="13" />
      <line x1="13" y1="3" x2="3" y2="13" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="8" cy="8" r="6" />
      <line x1="8" y1="5" x2="8" y2="5.5" strokeWidth="2.5" />
      <line x1="8" y1="7.5" x2="8" y2="11" />
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="8" r="6" strokeOpacity="0.25" />
      <path d="M8 2 A6 6 0 0 1 14 8" strokeLinecap="round" />
    </svg>
  );
}

const STYLES: Record<ToastType, { bar: string; icon: string; iconBg: string }> = {
  success: { bar: "border-[#00e5c9]/30 bg-[#00e5c9]/8", icon: "text-[#00e5c9]", iconBg: "bg-[#00e5c9]/15" },
  error:   { bar: "border-[#ff5240]/30 bg-[#ff5240]/8",  icon: "text-[#ff5240]",  iconBg: "bg-[#ff5240]/15"  },
  info:    { bar: "border-[#4a9eff]/30 bg-[#4a9eff]/8",  icon: "text-[#4a9eff]",  iconBg: "bg-[#4a9eff]/15"  },
  loading: { bar: "border-[#ffbe3c]/30 bg-[#ffbe3c]/8",  icon: "text-[#ffbe3c]",  iconBg: "bg-[#ffbe3c]/15"  },
};

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success") return <CheckIcon />;
  if (type === "error")   return <XIcon />;
  if (type === "loading") return <SpinnerIcon />;
  return <InfoIcon />;
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const s = STYLES[toast.type];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 32, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`flex items-start gap-3 min-w-[260px] max-w-[360px] p-3.5 rounded-xl border backdrop-blur-sm shadow-2xl ${s.bar}`}
      style={{ background: "rgba(8,8,8,0.92)" }}
    >
      <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${s.iconBg} ${s.icon}`}>
        <ToastIcon type={toast.type} />
      </div>
      <p className="flex-1 text-sm text-[#d8eaf5] leading-snug pt-0.5">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 mt-0.5 text-[#8898a5] hover:text-[#b8cfdf] transition-colors"
        aria-label="Dismiss"
      >
        <XIcon />
      </button>
    </motion.div>
  );
}

let _idCounter = 0;
function nextId() { return `toast-${++_idCounter}`; }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const dismissAll = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    setToasts([]);
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info", duration = 4000): string => {
    const id = nextId();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    }
    return id;
  }, [dismiss]);

  // Cleanup on unmount
  useEffect(() => {
    const t = timers.current;
    return () => { t.forEach((timer) => clearTimeout(timer)); };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
      {/* Toast container — bottom-center on mobile, bottom-right on desktop */}
      <div
        className="fixed z-[9999] bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 flex flex-col-reverse gap-2 pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
