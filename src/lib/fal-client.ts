export interface FalModelConfig {
  id: string;
  name: string;
  type: "IMAGE" | "VIDEO";
}

export const FAL_MODELS_CLIENT: FalModelConfig[] = [
  {
    id: "fal-ai/flux-pro",
    name: "Flux 1.0 Pro",
    type: "IMAGE",
  },
  {
    id: "fal-ai/flux-dev",
    name: "Flux 1.0 Dev",
    type: "IMAGE",
  },
  {
    id: "fal-ai/sdxl",
    name: "SDXL",
    type: "IMAGE",
  },
  {
    id: "fal-ai/stable-video-diffusion",
    name: "Stable Video Diffusion",
    type: "VIDEO",
  },
];

export function getModelsByTypeClient(type: "IMAGE" | "VIDEO"): FalModelConfig[] {
  return FAL_MODELS_CLIENT.filter((m) => m.type === type);
}
