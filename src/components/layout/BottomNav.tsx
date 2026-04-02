"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function GalleryIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="1" />
      <rect x="11" y="2" width="7" height="7" rx="1" />
      <rect x="2" y="11" width="7" height="7" rx="1" />
      <rect x="11" y="11" width="7" height="7" rx="1" />
    </svg>
  );
}

function GenerateIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="10,2 12.5,7.5 18,8.5 14,12.5 15,18 10,15.5 5,18 6,12.5 2,8.5 7.5,7.5" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="3" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  const isGallery = pathname === "/gallery" || pathname?.startsWith("/gallery/");
  const isGenerate = pathname === "/generate" || pathname?.startsWith("/generate/");
  const isSettings = pathname === "/settings" || pathname?.startsWith("/settings/");

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#080808]/95 backdrop-blur-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {/* Gallery */}
        <Link
          href="/gallery"
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[64px] ${
            isGallery ? "text-[#00e5c9]" : "text-[#8898a5] hover:text-[#b8cfdf]"
          }`}
        >
          <GalleryIcon active={isGallery} />
          <span className="text-[10px] font-medium">Gallery</span>
        </Link>

        {/* Generate — center accent button */}
        <Link
          href="/generate"
          className={`flex flex-col items-center gap-1 -mt-5 transition-all ${
            isGenerate ? "text-[#080808]" : "text-[#080808]"
          }`}
        >
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
              isGenerate
                ? "bg-[#00e5c9] shadow-[#00e5c9]/40"
                : "bg-gradient-to-br from-[#00e5c9] to-[#4a9eff] hover:shadow-[#00e5c9]/30"
            }`}
          >
            <GenerateIcon />
          </div>
          <span className={`text-[10px] font-medium mt-1 ${isGenerate ? "text-[#00e5c9]" : "text-[#8898a5]"}`}>Generate</span>
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[64px] ${
            isSettings ? "text-[#00e5c9]" : "text-[#8898a5] hover:text-[#b8cfdf]"
          }`}
        >
          <SettingsIcon active={isSettings} />
          <span className="text-[10px] font-medium">Settings</span>
        </Link>
      </div>
    </nav>
  );
}
