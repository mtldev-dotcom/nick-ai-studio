"use client";

import { GalleryGrid } from "@/components/GalleryGrid";

export default function GalleryPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#d8eaf5] font-['Rajdhani'] mb-2">
          Asset Gallery
        </h1>
        <p className="text-[#8898a5]">
          All your AI-generated assets, stored permanently in your R2 bucket.
        </p>
      </div>
      <GalleryGrid />
    </div>
  );
}
