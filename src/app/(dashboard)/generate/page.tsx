import { Suspense } from "react";
import { GenerationStudioWrapper } from "./GenerationStudioWrapper";

export default function GeneratePage() {
  return (
    <Suspense fallback={<GenerationSkeleton />}>
      <GenerationStudioWrapper />
    </Suspense>
  );
}

function GenerationSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-80 xl:w-96 h-96 rounded-2xl bg-white/5" />
        <div className="flex-1 h-96 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}
