"use client";

import { useSearchParams } from "next/navigation";
import { GenerationStudio } from "@/components/generation/GenerationStudio";

export function GenerationStudioWrapper() {
  const searchParams = useSearchParams();
  const inputJobId = searchParams.get("inputImage");
  const defaultModelId = searchParams.get("model");

  return (
    <GenerationStudio
      inputJobId={inputJobId}
      defaultModelId={defaultModelId}
    />
  );
}
