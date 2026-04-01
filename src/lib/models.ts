export interface FalModelConfig {
  id: string;
  name: string;
  type: "IMAGE" | "VIDEO";
  category: string;
  description: string;
  defaultParams: Record<string, unknown>;
  supportedParams: string[];
  pricing?: string;
}

export const FAL_MODELS: FalModelConfig[] = [
  // === IMAGE MODELS ===
  {
    id: "fal-ai/flux-pro/v1.1",
    name: "Flux 1.1 Pro",
    type: "IMAGE",
    category: "Flux",
    description: "Latest Flux model with improved quality and speed",
    defaultParams: { image_size: "square_hd" },
    supportedParams: ["prompt", "negative_prompt", "seed", "guidance_scale", "num_inference_steps", "image_size", "safety_tolerance"],
    pricing: "$0.05/image",
  },
  {
    id: "fal-ai/flux-pro",
    name: "Flux 1.0 Pro",
    type: "IMAGE",
    category: "Flux",
    description: "High-quality Flux model for professional use",
    defaultParams: { image_size: "square_hd" },
    supportedParams: ["prompt", "negative_prompt", "seed", "guidance_scale", "num_inference_steps", "image_size"],
    pricing: "$0.05/image",
  },
  {
    id: "fal-ai/flux/dev",
    name: "Flux 1.0 Dev",
    type: "IMAGE",
    category: "Flux",
    description: "Development version of Flux with balanced quality",
    defaultParams: { image_size: "square_hd" },
    supportedParams: ["prompt", "negative_prompt", "seed", "guidance_scale", "num_inference_steps", "image_size"],
    pricing: "$0.025/image",
  },
  {
    id: "fal-ai/flux/schnell",
    name: "Flux 1.0 Schnell",
    type: "IMAGE",
    category: "Flux",
    description: "Fast Flux model for rapid generation",
    defaultParams: { image_size: "square_hd" },
    supportedParams: ["prompt", "seed", "num_inference_steps", "image_size"],
    pricing: "$0.003/image",
  },
  {
    id: "fal-ai/flux-realism",
    name: "Flux Realism",
    type: "IMAGE",
    category: "Flux",
    description: "Photorealistic Flux variant",
    defaultParams: { image_size: "square_hd" },
    supportedParams: ["prompt", "negative_prompt", "seed", "guidance_scale", "num_inference_steps", "image_size"],
    pricing: "$0.05/image",
  },
  {
    id: "fal-ai/recraft-v3",
    name: "Recraft v3",
    type: "IMAGE",
    category: "Recraft",
    description: "Advanced image generation with style control",
    defaultParams: { image_size: "square_hd", style: "realistic_image" },
    supportedParams: ["prompt", "negative_prompt", "seed", "image_size", "style"],
    pricing: "$0.04/image",
  },
  {
    id: "fal-ai/ideogram/v2",
    name: "Ideogram v2",
    type: "IMAGE",
    category: "Ideogram",
    description: "Excellent text rendering in images",
    defaultParams: { image_size: "square_hd" },
    supportedParams: ["prompt", "negative_prompt", "seed", "image_size", "style"],
    pricing: "$0.05/image",
  },
  {
    id: "fal-ai/stable-diffusion-v35-large",
    name: "Stable Diffusion 3.5 Large",
    type: "IMAGE",
    category: "Stable Diffusion",
    description: "Latest SD model with improved quality",
    defaultParams: { image_size: "square_hd" },
    supportedParams: ["prompt", "negative_prompt", "seed", "guidance_scale", "num_inference_steps", "image_size"],
    pricing: "$0.035/image",
  },
  {
    id: "fal-ai/stable-diffusion-v3-medium",
    name: "Stable Diffusion 3 Medium",
    type: "IMAGE",
    category: "Stable Diffusion",
    description: "Balanced SD model for general use",
    defaultParams: { image_size: "square_hd" },
    supportedParams: ["prompt", "negative_prompt", "seed", "guidance_scale", "num_inference_steps", "image_size"],
    pricing: "$0.03/image",
  },
  {
    id: "fal-ai/sdxl",
    name: "SDXL",
    type: "IMAGE",
    category: "Stable Diffusion",
    description: "Stable Diffusion XL for high-res images",
    defaultParams: { image_size: "square_hd" },
    supportedParams: ["prompt", "negative_prompt", "seed", "guidance_scale", "num_inference_steps", "image_size"],
    pricing: "$0.02/image",
  },
  {
    id: "fal-ai/pixart-alpha",
    name: "PixArt Alpha",
    type: "IMAGE",
    category: "PixArt",
    description: "Efficient transformer-based generation",
    defaultParams: { image_size: "square_hd" },
    supportedParams: ["prompt", "negative_prompt", "seed", "guidance_scale", "num_inference_steps", "image_size"],
    pricing: "$0.01/image",
  },
  {
    id: "fal-ai/aura-flow",
    name: "AuraFlow",
    type: "IMAGE",
    category: "Aura",
    description: "Open-source flow-based generation",
    defaultParams: { image_size: "square_hd" },
    supportedParams: ["prompt", "negative_prompt", "seed", "guidance_scale", "num_inference_steps", "image_size"],
    pricing: "$0.02/image",
  },

  // === VIDEO MODELS ===
  {
    id: "fal-ai/kling-video/v2/standard",
    name: "Kling v2 Standard",
    type: "VIDEO",
    category: "Kling",
    description: "High-quality video generation from text or image",
    defaultParams: { duration: "5" },
    supportedParams: ["prompt", "negative_prompt", "seed", "duration", "aspect_ratio", "cfg_scale"],
    pricing: "$0.10/second",
  },
  {
    id: "fal-ai/kling-video/v2/pro",
    name: "Kling v2 Pro",
    type: "VIDEO",
    category: "Kling",
    description: "Premium Kling with better motion and quality",
    defaultParams: { duration: "5" },
    supportedParams: ["prompt", "negative_prompt", "seed", "duration", "aspect_ratio", "cfg_scale"],
    pricing: "$0.20/second",
  },
  {
    id: "fal-ai/luma-dream-machine",
    name: "Luma Dream Machine",
    type: "VIDEO",
    category: "Luma",
    description: "Smooth cinematic video generation",
    defaultParams: { duration: "5" },
    supportedParams: ["prompt", "negative_prompt", "seed", "duration", "aspect_ratio"],
    pricing: "$0.10/second",
  },
  {
    id: "fal-ai/minimax-video",
    name: "MiniMax Video",
    type: "VIDEO",
    category: "MiniMax",
    description: "Fast video generation with good quality",
    defaultParams: { duration: "6" },
    supportedParams: ["prompt", "negative_prompt", "seed", "duration"],
    pricing: "$0.08/second",
  },
  {
    id: "fal-ai/stable-video-diffusion",
    name: "Stable Video Diffusion",
    type: "VIDEO",
    category: "Stable Diffusion",
    description: "Image-to-video with Stable Diffusion",
    defaultParams: {},
    supportedParams: ["prompt", "first_frame_image", "seed", "motion_bucket_id", "fps", "num_inference_steps"],
    pricing: "$0.05/second",
  },
  {
    id: "fal-ai/fast-animatediff",
    name: "Fast AnimateDiff",
    type: "VIDEO",
    category: "AnimateDiff",
    description: "Quick animated video generation",
    defaultParams: {},
    supportedParams: ["prompt", "negative_prompt", "seed", "num_frames", "guidance_scale"],
    pricing: "$0.03/second",
  },
  {
    id: "fal-ai/hailuo-video",
    name: "Hailuo Video",
    type: "VIDEO",
    category: "Hailuo",
    description: "Realistic video generation",
    defaultParams: { duration: "6" },
    supportedParams: ["prompt", "negative_prompt", "seed", "duration", "aspect_ratio"],
    pricing: "$0.10/second",
  },

  // === UPSCALE MODELS ===
  {
    id: "fal-ai/esrgan",
    name: "ESRGAN Upscaler",
    type: "IMAGE",
    category: "Upscale",
    description: "AI-powered image upscaling",
    defaultParams: { scale: 4 },
    supportedParams: ["image_url", "scale"],
    pricing: "$0.01/image",
  },
  {
    id: "fal-ai/real-esrgan",
    name: "Real-ESRGAN",
    type: "IMAGE",
    category: "Upscale",
    description: "Real-world image super-resolution",
    defaultParams: { scale: 4 },
    supportedParams: ["image_url", "scale"],
    pricing: "$0.01/image",
  },

  // === IMAGE EDITING MODELS ===
  {
    id: "fal-ai/flux-2-pro/edit",
    name: "Flux 2 Pro Edit",
    type: "IMAGE",
    category: "Image Edit",
    description: "Edit images using text prompts with FLUX.2 Pro model",
    defaultParams: { image_size: "auto", safety_tolerance: "2", enable_safety_checker: true, output_format: "jpeg" },
    supportedParams: ["prompt", "image_urls", "image_size", "seed", "safety_tolerance", "enable_safety_checker", "output_format"],
    pricing: "$0.05/image",
  },
];

export function getModelById(modelId: string): FalModelConfig | undefined {
  return FAL_MODELS.find((m) => m.id === modelId);
}

export function getModelsByType(type: "IMAGE" | "VIDEO"): FalModelConfig[] {
  return FAL_MODELS.filter((m) => m.type === type);
}

export function getModelsByCategory(category: string): FalModelConfig[] {
  return FAL_MODELS.filter((m) => m.category === category);
}

export function getModelCategories(type?: "IMAGE" | "VIDEO"): string[] {
  const models = type ? FAL_MODELS.filter((m) => m.type === type) : FAL_MODELS;
  return [...new Set(models.map((m) => m.category))];
}