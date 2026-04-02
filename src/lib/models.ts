// ─── Types ────────────────────────────────────────────────────────────────────

export type ModelType =
  | "TEXT_TO_IMAGE"
  | "IMAGE_TO_IMAGE"
  | "TEXT_TO_VIDEO"
  | "IMAGE_TO_VIDEO"
  | "UPSCALE"
  | "IMAGE_EDIT"
  | "AUDIO"
  | "MUSIC";

/** Derive the Job AssetType from the model type */
export function getAssetType(modelType: ModelType): "IMAGE" | "VIDEO" | "AUDIO" {
  if (["TEXT_TO_VIDEO", "IMAGE_TO_VIDEO"].includes(modelType)) return "VIDEO";
  if (["AUDIO", "MUSIC"].includes(modelType)) return "AUDIO";
  return "IMAGE";
}

export type ParamType =
  | "textarea"       // multi-line text (prompt, negative_prompt)
  | "text"           // single-line text
  | "number"         // integer/float input
  | "slider"         // range with min/max/step
  | "select"         // dropdown
  | "toggle"         // boolean switch
  | "image-upload"   // single image URL input
  | "images-upload"  // multiple image URLs
  | "size-picker"    // image_size presets
  | "aspect-ratio";  // aspect_ratio string presets

export interface SelectOption {
  value: string;
  label: string;
}

export interface ModelParam {
  key: string;
  label: string;
  type: ParamType;
  required?: boolean;
  default?: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: SelectOption[];
  description?: string;
}

export interface FalModelConfig {
  id: string;
  name: string;
  category: string;
  modelType: ModelType;
  description: string;
  params: ModelParam[];
  defaultParams: Record<string, unknown>;
  pricing?: string;
}

// ─── Reusable param sets ──────────────────────────────────────────────────────

const PROMPT: ModelParam = {
  key: "prompt",
  label: "Prompt",
  type: "textarea",
  required: true,
  description: "Describe what you want to generate",
};

const NEGATIVE_PROMPT: ModelParam = {
  key: "negative_prompt",
  label: "Negative Prompt",
  type: "textarea",
  description: "What to exclude from the generation",
};

const SEED: ModelParam = {
  key: "seed",
  label: "Seed",
  type: "number",
  min: 0,
  max: 2147483647,
  description: "Fixed seed for reproducible results. Leave empty for random.",
};

const IMAGE_SIZE: ModelParam = {
  key: "image_size",
  label: "Image Size",
  type: "size-picker",
  default: "square_hd",
  options: [
    { value: "square_hd", label: "Square HD (1024×1024)" },
    { value: "square", label: "Square (512×512)" },
    { value: "portrait_4_3", label: "Portrait 4:3" },
    { value: "portrait_16_9", label: "Portrait 16:9" },
    { value: "landscape_4_3", label: "Landscape 4:3" },
    { value: "landscape_16_9", label: "Landscape 16:9" },
  ],
};

const ASPECT_RATIO_IMAGE: ModelParam = {
  key: "aspect_ratio",
  label: "Aspect Ratio",
  type: "aspect-ratio",
  default: "1:1",
  options: [
    { value: "1:1", label: "1:1" },
    { value: "16:9", label: "16:9" },
    { value: "9:16", label: "9:16" },
    { value: "4:3", label: "4:3" },
    { value: "3:4", label: "3:4" },
    { value: "3:2", label: "3:2" },
    { value: "2:3", label: "2:3" },
    { value: "21:9", label: "21:9" },
  ],
};

const ASPECT_RATIO_VIDEO: ModelParam = {
  key: "aspect_ratio",
  label: "Aspect Ratio",
  type: "aspect-ratio",
  default: "16:9",
  options: [
    { value: "16:9", label: "16:9" },
    { value: "9:16", label: "9:16" },
    { value: "1:1", label: "1:1" },
    { value: "4:3", label: "4:3" },
    { value: "3:4", label: "3:4" },
  ],
};

const GUIDANCE_SCALE: ModelParam = {
  key: "guidance_scale",
  label: "Guidance Scale",
  type: "slider",
  min: 1,
  max: 20,
  step: 0.5,
  default: 7.5,
  description: "How closely to follow the prompt. Higher = more faithful but less creative.",
};

const NUM_INFERENCE_STEPS: ModelParam = {
  key: "num_inference_steps",
  label: "Inference Steps",
  type: "slider",
  min: 1,
  max: 100,
  step: 1,
  default: 28,
  description: "More steps = higher quality but slower generation.",
};

const NUM_IMAGES: ModelParam = {
  key: "num_images",
  label: "Number of Images",
  type: "slider",
  min: 1,
  max: 4,
  step: 1,
  default: 1,
  description: "Generate multiple variations at once.",
};

const OUTPUT_FORMAT: ModelParam = {
  key: "output_format",
  label: "Output Format",
  type: "select",
  default: "jpeg",
  options: [
    { value: "jpeg", label: "JPEG" },
    { value: "png", label: "PNG" },
    { value: "webp", label: "WebP" },
  ],
};

const SAFETY_CHECKER: ModelParam = {
  key: "enable_safety_checker",
  label: "Safety Checker",
  type: "toggle",
  default: true,
  description: "Blocks NSFW content. Disable only if you've verified your use case.",
};

const SAFETY_TOLERANCE: ModelParam = {
  key: "safety_tolerance",
  label: "Safety Tolerance",
  type: "select",
  default: "2",
  options: [
    { value: "1", label: "Strictest" },
    { value: "2", label: "Moderate (default)" },
    { value: "3", label: "Relaxed" },
    { value: "4", label: "Permissive" },
    { value: "5", label: "Most Permissive" },
    { value: "6", label: "Unrestricted" },
  ],
  description: "Controls content filtering strictness.",
};

const PROMPT_EXPANSION: ModelParam = {
  key: "enable_prompt_expansion",
  label: "Prompt Expansion",
  type: "toggle",
  default: false,
  description: "Automatically enhances your prompt using an LLM for richer results.",
};

const VIDEO_DURATION: ModelParam = {
  key: "duration",
  label: "Duration (seconds)",
  type: "slider",
  min: 1,
  max: 10,
  step: 1,
  default: 5,
};

const VIDEO_CFG: ModelParam = {
  key: "cfg_scale",
  label: "CFG Scale",
  type: "slider",
  min: 1,
  max: 15,
  step: 0.5,
  default: 7,
  description: "Guidance strength for video generation.",
};

const FIRST_FRAME_IMAGE: ModelParam = {
  key: "image_url",
  label: "Input Image",
  type: "image-upload",
  required: true,
  description: "Image to animate into video.",
};

const IMAGE_URL_SINGLE: ModelParam = {
  key: "image_url",
  label: "Input Image",
  type: "image-upload",
  required: true,
  description: "The image to process.",
};

const IMAGE_URLS_MULTI: ModelParam = {
  key: "image_urls",
  label: "Input Images",
  type: "images-upload",
  required: true,
  description: "One or more images to edit.",
};

const STRENGTH: ModelParam = {
  key: "strength",
  label: "Denoising Strength",
  type: "slider",
  min: 0,
  max: 1,
  step: 0.05,
  default: 0.85,
  description: "How much to modify the input image. 1.0 = fully regenerate.",
};

const UPSCALE_FACTOR: ModelParam = {
  key: "scale",
  label: "Upscale Factor",
  type: "select",
  default: 4,
  options: [
    { value: "2", label: "2× — fast" },
    { value: "4", label: "4× — recommended" },
  ],
};

const MOTION_BUCKET: ModelParam = {
  key: "motion_bucket_id",
  label: "Motion Intensity",
  type: "slider",
  min: 1,
  max: 255,
  step: 1,
  default: 127,
  description: "Controls how much the subject moves. Higher = more motion.",
};

// ─── Model Catalog ────────────────────────────────────────────────────────────

export const FAL_MODELS: FalModelConfig[] = [

  // ═══════════════════════════════════════════════════════════
  // TEXT → IMAGE
  // ═══════════════════════════════════════════════════════════

  // ── Flux family ──────────────────────────────────────────
  {
    id: "fal-ai/flux-pro/v1.1",
    name: "Flux 1.1 Pro",
    category: "Flux",
    modelType: "TEXT_TO_IMAGE",
    description: "Latest Flux Pro — highest quality, fastest",
    pricing: "$0.05/image",
    defaultParams: { image_size: "square_hd", safety_tolerance: "2" },
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_SIZE, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, NUM_IMAGES, SAFETY_TOLERANCE, SEED, OUTPUT_FORMAT, PROMPT_EXPANSION],
  },
  {
    id: "fal-ai/flux-pro/v1.1-ultra",
    name: "Flux 1.1 Pro Ultra",
    category: "Flux",
    modelType: "TEXT_TO_IMAGE",
    description: "Ultra-high resolution Flux with up to 4MP output",
    pricing: "$0.06/image",
    defaultParams: { aspect_ratio: "1:1", safety_tolerance: "2" },
    params: [PROMPT, ASPECT_RATIO_IMAGE, SAFETY_TOLERANCE, SEED, OUTPUT_FORMAT, PROMPT_EXPANSION],
  },
  {
    id: "fal-ai/flux-pro",
    name: "Flux 1.0 Pro",
    category: "Flux",
    modelType: "TEXT_TO_IMAGE",
    description: "Professional Flux — great quality/cost balance",
    pricing: "$0.05/image",
    defaultParams: { image_size: "square_hd" },
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_SIZE, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, NUM_IMAGES, SEED, OUTPUT_FORMAT],
  },
  {
    id: "fal-ai/flux/dev",
    name: "Flux 1.0 Dev",
    category: "Flux",
    modelType: "TEXT_TO_IMAGE",
    description: "Open-weight Flux for development and research",
    pricing: "$0.025/image",
    defaultParams: { image_size: "square_hd" },
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_SIZE, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, NUM_IMAGES, SEED, OUTPUT_FORMAT, SAFETY_CHECKER],
  },
  {
    id: "fal-ai/flux/schnell",
    name: "Flux Schnell",
    category: "Flux",
    modelType: "TEXT_TO_IMAGE",
    description: "Fastest Flux — ideal for drafts and iteration",
    pricing: "$0.003/image",
    defaultParams: { image_size: "square_hd" },
    params: [PROMPT, IMAGE_SIZE, NUM_INFERENCE_STEPS, NUM_IMAGES, SEED, OUTPUT_FORMAT, SAFETY_CHECKER],
  },
  {
    id: "fal-ai/flux-realism",
    name: "Flux Realism",
    category: "Flux",
    modelType: "TEXT_TO_IMAGE",
    description: "Photorealistic Flux LoRA — highly realistic photography",
    pricing: "$0.05/image",
    defaultParams: { image_size: "square_hd" },
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_SIZE, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, NUM_IMAGES, SEED, OUTPUT_FORMAT, SAFETY_CHECKER],
  },
  {
    id: "fal-ai/flux-lora",
    name: "Flux Dev LoRA",
    category: "Flux",
    modelType: "TEXT_TO_IMAGE",
    description: "Flux Dev with custom LoRA support",
    pricing: "$0.025/image",
    defaultParams: { image_size: "square_hd" },
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_SIZE, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, NUM_IMAGES, SEED, OUTPUT_FORMAT, SAFETY_CHECKER],
  },
  {
    id: "fal-ai/hyper-sdxl",
    name: "Hyper SDXL",
    category: "Flux",
    modelType: "TEXT_TO_IMAGE",
    description: "Ultra-fast SDXL with Hyper acceleration",
    pricing: "$0.008/image",
    defaultParams: { image_size: "square_hd" },
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_SIZE, NUM_INFERENCE_STEPS, SEED, OUTPUT_FORMAT],
  },

  // ── Recraft ───────────────────────────────────────────────
  {
    id: "fal-ai/recraft-v3",
    name: "Recraft v3",
    category: "Recraft",
    modelType: "TEXT_TO_IMAGE",
    description: "Versatile generation with precise style control",
    pricing: "$0.04/image",
    defaultParams: { image_size: "square_hd", style: "realistic_image" },
    params: [
      PROMPT,
      IMAGE_SIZE,
      {
        key: "style",
        label: "Style",
        type: "select",
        default: "realistic_image",
        options: [
          { value: "realistic_image", label: "Realistic Photo" },
          { value: "digital_illustration", label: "Digital Illustration" },
          { value: "vector_illustration", label: "Vector Illustration" },
          { value: "realistic_image/b_and_w", label: "Black & White Photo" },
          { value: "digital_illustration/pixel_art", label: "Pixel Art" },
          { value: "digital_illustration/hand_drawn", label: "Hand Drawn" },
          { value: "digital_illustration/grain", label: "Grainy" },
          { value: "digital_illustration/infantile_sketch", label: "Sketch" },
          { value: "digital_illustration/2d_art_poster", label: "2D Art Poster" },
          { value: "digital_illustration/engraving_color", label: "Engraving" },
          { value: "digital_illustration/flat_air_art", label: "Flat Air Art" },
          { value: "digital_illustration/watercolor", label: "Watercolor" },
        ],
      },
      SEED,
    ],
  },

  // ── Ideogram ─────────────────────────────────────────────
  {
    id: "fal-ai/ideogram/v2",
    name: "Ideogram v2",
    category: "Ideogram",
    modelType: "TEXT_TO_IMAGE",
    description: "Best-in-class text rendering in images",
    pricing: "$0.05/image",
    defaultParams: { aspect_ratio: "1:1" },
    params: [
      PROMPT,
      NEGATIVE_PROMPT,
      ASPECT_RATIO_IMAGE,
      {
        key: "style",
        label: "Style",
        type: "select",
        default: "AUTO",
        options: [
          { value: "AUTO", label: "Auto" },
          { value: "GENERAL", label: "General" },
          { value: "REALISTIC", label: "Realistic" },
          { value: "DESIGN", label: "Design" },
          { value: "RENDER_3D", label: "3D Render" },
          { value: "ANIME", label: "Anime" },
        ],
      },
      SEED,
    ],
  },
  {
    id: "fal-ai/ideogram/v2/turbo",
    name: "Ideogram v2 Turbo",
    category: "Ideogram",
    modelType: "TEXT_TO_IMAGE",
    description: "Fast Ideogram — lower cost, still great text",
    pricing: "$0.025/image",
    defaultParams: { aspect_ratio: "1:1" },
    params: [PROMPT, NEGATIVE_PROMPT, ASPECT_RATIO_IMAGE, SEED],
  },

  // ── Stable Diffusion ──────────────────────────────────────
  {
    id: "fal-ai/stable-diffusion-v35-large",
    name: "SD 3.5 Large",
    category: "Stable Diffusion",
    modelType: "TEXT_TO_IMAGE",
    description: "Stable Diffusion 3.5 — excellent prompt following",
    pricing: "$0.035/image",
    defaultParams: { image_size: "square_hd" },
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_SIZE, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, NUM_IMAGES, SEED, OUTPUT_FORMAT],
  },
  {
    id: "fal-ai/stable-diffusion-v3-medium",
    name: "SD 3 Medium",
    category: "Stable Diffusion",
    modelType: "TEXT_TO_IMAGE",
    description: "Stable Diffusion 3 Medium — fast and capable",
    pricing: "$0.02/image",
    defaultParams: { image_size: "square_hd" },
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_SIZE, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, SEED, OUTPUT_FORMAT],
  },
  {
    id: "fal-ai/sdxl",
    name: "SDXL",
    category: "Stable Diffusion",
    modelType: "TEXT_TO_IMAGE",
    description: "Stable Diffusion XL — high-res, highly customizable",
    pricing: "$0.02/image",
    defaultParams: { image_size: "square_hd" },
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_SIZE, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, NUM_IMAGES, SEED, OUTPUT_FORMAT],
  },
  {
    id: "fal-ai/fast-sdxl",
    name: "Fast SDXL",
    category: "Stable Diffusion",
    modelType: "TEXT_TO_IMAGE",
    description: "Accelerated SDXL for rapid iteration",
    pricing: "$0.006/image",
    defaultParams: { image_size: "square_hd" },
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_SIZE, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, NUM_IMAGES, SEED],
  },

  // ── Other image models ─────────────────────────────────────
  {
    id: "fal-ai/kolors",
    name: "Kolors",
    category: "Kolors",
    modelType: "TEXT_TO_IMAGE",
    description: "High-fidelity text-to-image with great color accuracy",
    pricing: "$0.02/image",
    defaultParams: { image_size: "square_hd" },
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_SIZE, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, SEED],
  },
  {
    id: "fal-ai/pixart-sigma",
    name: "PixArt Sigma",
    category: "PixArt",
    modelType: "TEXT_TO_IMAGE",
    description: "Efficient transformer diffusion model",
    pricing: "$0.01/image",
    defaultParams: { image_size: "square_hd" },
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_SIZE, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, SEED, OUTPUT_FORMAT],
  },
  {
    id: "fal-ai/aura-flow",
    name: "AuraFlow",
    category: "AuraFlow",
    modelType: "TEXT_TO_IMAGE",
    description: "Open-source flow-based text-to-image",
    pricing: "$0.02/image",
    defaultParams: { image_size: "square_hd" },
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_SIZE, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, SEED, OUTPUT_FORMAT],
  },
  {
    id: "fal-ai/sana",
    name: "Sana",
    category: "Sana",
    modelType: "TEXT_TO_IMAGE",
    description: "Efficient high-resolution text-to-image at 4K",
    pricing: "$0.01/image",
    defaultParams: { image_size: "square_hd" },
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_SIZE, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, SEED, OUTPUT_FORMAT, SAFETY_CHECKER],
  },

  // ═══════════════════════════════════════════════════════════
  // IMAGE → IMAGE
  // ═══════════════════════════════════════════════════════════

  {
    id: "fal-ai/flux-pro/kontext",
    name: "Flux Kontext",
    category: "Flux Edit",
    modelType: "IMAGE_TO_IMAGE",
    description: "Edit images with text instructions — powerful context-aware editing",
    pricing: "$0.04/image",
    defaultParams: { guidance_scale: 3.5 },
    params: [
      IMAGE_URL_SINGLE,
      PROMPT,
      GUIDANCE_SCALE,
      NUM_INFERENCE_STEPS,
      SEED,
      OUTPUT_FORMAT,
      SAFETY_TOLERANCE,
    ],
  },
  {
    id: "fal-ai/flux-general",
    name: "Flux ControlNet",
    category: "Flux Edit",
    modelType: "IMAGE_TO_IMAGE",
    description: "Flux with ControlNet — structure-guided generation",
    pricing: "$0.05/image",
    defaultParams: { image_size: "square_hd" },
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_URL_SINGLE, STRENGTH, IMAGE_SIZE, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, SEED, OUTPUT_FORMAT],
  },
  {
    id: "fal-ai/flux-lora-fill",
    name: "Flux Fill (Inpaint)",
    category: "Flux Edit",
    modelType: "IMAGE_EDIT",
    description: "Fill masked regions with AI-generated content",
    pricing: "$0.04/image",
    defaultParams: { image_size: "square_hd" },
    params: [PROMPT, IMAGE_URL_SINGLE, IMAGE_SIZE, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, SEED, OUTPUT_FORMAT],
  },
  {
    id: "fal-ai/ip-adapter-face-id",
    name: "IP-Adapter Face ID",
    category: "Flux Edit",
    modelType: "IMAGE_TO_IMAGE",
    description: "Transfer a face identity into new generated images",
    pricing: "$0.05/image",
    defaultParams: {},
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_URL_SINGLE, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, SEED],
  },
  {
    id: "fal-ai/stable-diffusion-v3-medium/image-to-image",
    name: "SD3 Img2Img",
    category: "Stable Diffusion",
    modelType: "IMAGE_TO_IMAGE",
    description: "Transform images using SD3 with a text prompt",
    pricing: "$0.025/image",
    defaultParams: {},
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_URL_SINGLE, STRENGTH, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, SEED],
  },
  {
    id: "fal-ai/sdxl/image-to-image",
    name: "SDXL Img2Img",
    category: "Stable Diffusion",
    modelType: "IMAGE_TO_IMAGE",
    description: "Style transfer and image transformation with SDXL",
    pricing: "$0.02/image",
    defaultParams: {},
    params: [PROMPT, NEGATIVE_PROMPT, IMAGE_URL_SINGLE, STRENGTH, GUIDANCE_SCALE, NUM_INFERENCE_STEPS, SEED],
  },
  {
    id: "fal-ai/flux-2-pro/edit",
    name: "Flux 2 Pro Edit",
    category: "Flux Edit",
    modelType: "IMAGE_EDIT",
    description: "Edit images with multi-image instructions",
    pricing: "$0.05/image",
    defaultParams: { image_size: "auto", safety_tolerance: "2", enable_safety_checker: true, output_format: "jpeg" },
    params: [PROMPT, IMAGE_URLS_MULTI, IMAGE_SIZE, SEED, SAFETY_TOLERANCE, SAFETY_CHECKER, OUTPUT_FORMAT],
  },

  // ═══════════════════════════════════════════════════════════
  // TEXT → VIDEO
  // ═══════════════════════════════════════════════════════════

  {
    id: "fal-ai/kling-video/v2/standard/text-to-video",
    name: "Kling v2 Standard",
    category: "Kling",
    modelType: "TEXT_TO_VIDEO",
    description: "High-quality text-to-video with cinematic output",
    pricing: "$0.10/second",
    defaultParams: { duration: "5", aspect_ratio: "16:9" },
    params: [PROMPT, NEGATIVE_PROMPT, ASPECT_RATIO_VIDEO, VIDEO_DURATION, VIDEO_CFG, SEED],
  },
  {
    id: "fal-ai/kling-video/v2/pro/text-to-video",
    name: "Kling v2 Pro",
    category: "Kling",
    modelType: "TEXT_TO_VIDEO",
    description: "Premium Kling — best motion quality and realism",
    pricing: "$0.20/second",
    defaultParams: { duration: "5", aspect_ratio: "16:9" },
    params: [PROMPT, NEGATIVE_PROMPT, ASPECT_RATIO_VIDEO, VIDEO_DURATION, VIDEO_CFG, SEED],
  },
  {
    id: "fal-ai/luma-dream-machine/ray-2",
    name: "Luma Ray 2",
    category: "Luma",
    modelType: "TEXT_TO_VIDEO",
    description: "Photorealistic video from Luma AI — smooth and cinematic",
    pricing: "$0.10/second",
    defaultParams: { aspect_ratio: "16:9" },
    params: [PROMPT, ASPECT_RATIO_VIDEO, VIDEO_DURATION, SEED],
  },
  {
    id: "fal-ai/luma-dream-machine",
    name: "Luma Dream Machine",
    category: "Luma",
    modelType: "TEXT_TO_VIDEO",
    description: "Creative video generation with imaginative freedom",
    pricing: "$0.08/second",
    defaultParams: { aspect_ratio: "16:9" },
    params: [PROMPT, ASPECT_RATIO_VIDEO, VIDEO_DURATION, SEED],
  },
  {
    id: "fal-ai/minimax-video-01",
    name: "MiniMax Video 01",
    category: "MiniMax",
    modelType: "TEXT_TO_VIDEO",
    description: "Fluid, detailed video generation",
    pricing: "$0.08/second",
    defaultParams: { aspect_ratio: "16:9" },
    params: [PROMPT, ASPECT_RATIO_VIDEO, SEED],
  },
  {
    id: "fal-ai/hailuo-video-02",
    name: "Hailuo Video 02",
    category: "Hailuo",
    modelType: "TEXT_TO_VIDEO",
    description: "High-quality video with realistic motion",
    pricing: "$0.10/second",
    defaultParams: { duration: "6", aspect_ratio: "16:9" },
    params: [PROMPT, ASPECT_RATIO_VIDEO, VIDEO_DURATION, SEED],
  },
  {
    id: "fal-ai/wan-t2v",
    name: "Wan 2.1 T2V",
    category: "Wan",
    modelType: "TEXT_TO_VIDEO",
    description: "Open-source text-to-video with high motion fidelity",
    pricing: "$0.05/second",
    defaultParams: { aspect_ratio: "16:9" },
    params: [PROMPT, NEGATIVE_PROMPT, ASPECT_RATIO_VIDEO, VIDEO_DURATION, SEED],
  },
  {
    id: "fal-ai/cogvideox-5b",
    name: "CogVideoX 5B",
    category: "CogVideo",
    modelType: "TEXT_TO_VIDEO",
    description: "Open-source video generation from Zhipu AI",
    pricing: "$0.05/second",
    defaultParams: {},
    params: [PROMPT, NEGATIVE_PROMPT, VIDEO_DURATION, SEED],
  },
  {
    id: "fal-ai/fast-animatediff/turbo",
    name: "AnimateDiff Turbo",
    category: "AnimateDiff",
    modelType: "TEXT_TO_VIDEO",
    description: "Fast animated video from text — great for quick previews",
    pricing: "$0.02/second",
    defaultParams: {},
    params: [PROMPT, NEGATIVE_PROMPT, GUIDANCE_SCALE, SEED,
      { key: "num_frames", label: "Frames", type: "slider", min: 8, max: 32, step: 8, default: 16 }],
  },

  // ═══════════════════════════════════════════════════════════
  // IMAGE → VIDEO
  // ═══════════════════════════════════════════════════════════

  {
    id: "fal-ai/kling-video/v2/standard/image-to-video",
    name: "Kling v2 I2V Standard",
    category: "Kling",
    modelType: "IMAGE_TO_VIDEO",
    description: "Animate any image into a video with Kling v2",
    pricing: "$0.10/second",
    defaultParams: { duration: "5", aspect_ratio: "16:9" },
    params: [FIRST_FRAME_IMAGE, PROMPT, ASPECT_RATIO_VIDEO, VIDEO_DURATION, VIDEO_CFG, SEED],
  },
  {
    id: "fal-ai/kling-video/v2/pro/image-to-video",
    name: "Kling v2 I2V Pro",
    category: "Kling",
    modelType: "IMAGE_TO_VIDEO",
    description: "Premium image-to-video animation with Kling v2 Pro",
    pricing: "$0.20/second",
    defaultParams: { duration: "5", aspect_ratio: "16:9" },
    params: [FIRST_FRAME_IMAGE, PROMPT, ASPECT_RATIO_VIDEO, VIDEO_DURATION, VIDEO_CFG, SEED],
  },
  {
    id: "fal-ai/stable-video-diffusion",
    name: "Stable Video Diffusion",
    category: "Stable Video",
    modelType: "IMAGE_TO_VIDEO",
    description: "Animate images with fluid, stable motion",
    pricing: "$0.05/second",
    defaultParams: {},
    params: [FIRST_FRAME_IMAGE, MOTION_BUCKET, SEED,
      { key: "fps", label: "FPS", type: "select", default: 7, options: [{ value: "7", label: "7 fps" }, { value: "14", label: "14 fps" }, { value: "25", label: "25 fps" }] },
      { key: "num_inference_steps", label: "Inference Steps", type: "slider", min: 10, max: 50, step: 5, default: 25 }],
  },
  {
    id: "fal-ai/wan-i2v",
    name: "Wan 2.1 I2V",
    category: "Wan",
    modelType: "IMAGE_TO_VIDEO",
    description: "Open-source image-to-video with strong temporal coherence",
    pricing: "$0.05/second",
    defaultParams: {},
    params: [FIRST_FRAME_IMAGE, PROMPT, NEGATIVE_PROMPT, VIDEO_DURATION, SEED],
  },
  {
    id: "fal-ai/ltx-video-v097/image-to-video",
    name: "LTX Video",
    category: "LTX",
    modelType: "IMAGE_TO_VIDEO",
    description: "Real-time capable image animation",
    pricing: "$0.04/second",
    defaultParams: {},
    params: [FIRST_FRAME_IMAGE, PROMPT, NEGATIVE_PROMPT, SEED,
      { key: "num_inference_steps", label: "Inference Steps", type: "slider", min: 10, max: 50, step: 5, default: 40 }],
  },
  {
    id: "fal-ai/luma-dream-machine/image-to-video",
    name: "Luma Image-to-Video",
    category: "Luma",
    modelType: "IMAGE_TO_VIDEO",
    description: "Bring photos to life with Luma Dream Machine",
    pricing: "$0.10/second",
    defaultParams: {},
    params: [FIRST_FRAME_IMAGE, PROMPT, ASPECT_RATIO_VIDEO, SEED],
  },
  {
    id: "fal-ai/hailuo-video-02/image-to-video",
    name: "Hailuo I2V",
    category: "Hailuo",
    modelType: "IMAGE_TO_VIDEO",
    description: "Animate images with realistic motion using Hailuo",
    pricing: "$0.10/second",
    defaultParams: {},
    params: [FIRST_FRAME_IMAGE, PROMPT, VIDEO_DURATION, SEED],
  },

  // ═══════════════════════════════════════════════════════════
  // UPSCALE
  // ═══════════════════════════════════════════════════════════

  {
    id: "fal-ai/aura-sr",
    name: "AuraSR",
    category: "Upscale",
    modelType: "UPSCALE",
    description: "GAN-based upscaling — clean, detailed 4× upscale",
    pricing: "$0.01/image",
    defaultParams: { upscaling_factor: 4 },
    params: [
      IMAGE_URL_SINGLE,
      {
        key: "upscaling_factor",
        label: "Upscale Factor",
        type: "select",
        default: 4,
        options: [{ value: "2", label: "2×" }, { value: "4", label: "4×" }],
      },
    ],
  },
  {
    id: "fal-ai/clarity-upscaler",
    name: "Clarity Upscaler",
    category: "Upscale",
    modelType: "UPSCALE",
    description: "AI-powered upscaler — preserves fine details and textures",
    pricing: "$0.02/image",
    defaultParams: { scale: 2, creativity: 0.35 },
    params: [
      IMAGE_URL_SINGLE,
      PROMPT,
      { key: "scale", label: "Upscale Factor", type: "select", default: 2, options: [{ value: "2", label: "2×" }, { value: "4", label: "4×" }] },
      { key: "creativity", label: "Creativity", type: "slider", min: 0, max: 1, step: 0.05, default: 0.35, description: "Higher adds detail; lower preserves the original." },
    ],
  },
  {
    id: "fal-ai/esrgan",
    name: "ESRGAN",
    category: "Upscale",
    modelType: "UPSCALE",
    description: "Classic AI upscaling — fast and reliable",
    pricing: "$0.01/image",
    defaultParams: { scale: 4 },
    params: [IMAGE_URL_SINGLE, UPSCALE_FACTOR],
  },
  {
    id: "fal-ai/real-esrgan",
    name: "Real-ESRGAN",
    category: "Upscale",
    modelType: "UPSCALE",
    description: "Trained on real-world degradations — great for photos",
    pricing: "$0.01/image",
    defaultParams: { scale: 4 },
    params: [IMAGE_URL_SINGLE, UPSCALE_FACTOR],
  },
  {
    id: "fal-ai/ccsr",
    name: "CCSR Upscaler",
    category: "Upscale",
    modelType: "UPSCALE",
    description: "Content-consistent super-resolution",
    pricing: "$0.01/image",
    defaultParams: { scale: 4 },
    params: [IMAGE_URL_SINGLE, UPSCALE_FACTOR],
  },

  // ═══════════════════════════════════════════════════════════
  // IMAGE EDITING
  // ═══════════════════════════════════════════════════════════

  {
    id: "fal-ai/bria/background/remove",
    name: "Remove Background",
    category: "Image Tools",
    modelType: "IMAGE_EDIT",
    description: "One-click background removal with clean edges",
    pricing: "$0.01/image",
    defaultParams: {},
    params: [IMAGE_URL_SINGLE],
  },
  {
    id: "fal-ai/face-to-sticker",
    name: "Face to Sticker",
    category: "Image Tools",
    modelType: "IMAGE_EDIT",
    description: "Turn any face photo into a fun sticker",
    pricing: "$0.02/image",
    defaultParams: {},
    params: [IMAGE_URL_SINGLE, PROMPT, SEED],
  },
  {
    id: "fal-ai/gfpgan",
    name: "Face Restore (GFPGAN)",
    category: "Image Tools",
    modelType: "IMAGE_EDIT",
    description: "Restore and enhance degraded face photos",
    pricing: "$0.01/image",
    defaultParams: { version: "1.4" },
    params: [
      IMAGE_URL_SINGLE,
      { key: "version", label: "Version", type: "select", default: "1.4", options: [{ value: "1.4", label: "v1.4 (recommended)" }, { value: "1.3", label: "v1.3" }] },
      { key: "upscale", label: "Upscale", type: "slider", min: 1, max: 4, step: 1, default: 2 },
    ],
  },
  {
    id: "fal-ai/imageutils/rembg",
    name: "Remove BG (rembg)",
    category: "Image Tools",
    modelType: "IMAGE_EDIT",
    description: "Fast background removal using rembg",
    pricing: "$0.005/image",
    defaultParams: {},
    params: [IMAGE_URL_SINGLE],
  },

  // ═══════════════════════════════════════════════════════════
  // AUDIO
  // ═══════════════════════════════════════════════════════════

  {
    id: "fal-ai/kokoro/american-english",
    name: "Kokoro TTS (English)",
    category: "Text to Speech",
    modelType: "AUDIO",
    description: "High-quality American English text-to-speech",
    pricing: "$0.001/char",
    defaultParams: {},
    params: [
      { key: "prompt", label: "Text", type: "textarea", required: true, description: "Text to convert to speech" },
      { key: "voice", label: "Voice", type: "select", default: "af_heart", options: [
        { value: "af_heart", label: "Heart (F)" },
        { value: "af_bella", label: "Bella (F)" },
        { value: "af_sarah", label: "Sarah (F)" },
        { value: "af_nicole", label: "Nicole (F)" },
        { value: "am_adam", label: "Adam (M)" },
        { value: "am_michael", label: "Michael (M)" },
      ]},
      { key: "speed", label: "Speed", type: "slider", min: 0.5, max: 2.0, step: 0.1, default: 1.0 },
    ],
  },
  {
    id: "fal-ai/playht/tts/v3",
    name: "PlayHT TTS v3",
    category: "Text to Speech",
    modelType: "AUDIO",
    description: "Highly realistic speech synthesis with emotion control",
    pricing: "$0.002/char",
    defaultParams: {},
    params: [
      { key: "prompt", label: "Text", type: "textarea", required: true },
      { key: "voice", label: "Voice ID", type: "text", default: "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json", description: "PlayHT voice manifest URL" },
    ],
  },
  {
    id: "fal-ai/f5-tts",
    name: "F5 TTS",
    category: "Text to Speech",
    modelType: "AUDIO",
    description: "Zero-shot text-to-speech with voice cloning from a reference clip",
    pricing: "$0.002/char",
    defaultParams: {},
    params: [
      { key: "gen_text", label: "Text to Speak", type: "textarea", required: true },
      { key: "ref_audio_url", label: "Reference Audio URL", type: "text", description: "URL to a reference audio file for voice cloning" },
      { key: "ref_text", label: "Reference Text", type: "textarea", description: "Transcript of the reference audio" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MUSIC
  // ═══════════════════════════════════════════════════════════

  {
    id: "fal-ai/stable-audio",
    name: "Stable Audio",
    category: "Music",
    modelType: "MUSIC",
    description: "Generate music and audio from text prompts",
    pricing: "$0.03/second",
    defaultParams: { seconds_start: 0, seconds_total: 30 },
    params: [
      { key: "prompt", label: "Prompt", type: "textarea", required: true, description: "Describe the music: genre, instruments, mood, BPM" },
      { key: "negative_prompt", label: "Negative Prompt", type: "textarea" },
      { key: "seconds_total", label: "Duration (seconds)", type: "slider", min: 1, max: 90, step: 1, default: 30 },
      SEED,
    ],
  },
  {
    id: "fal-ai/musicgen",
    name: "MusicGen",
    category: "Music",
    modelType: "MUSIC",
    description: "Meta's MusicGen — controllable music generation",
    pricing: "$0.02/second",
    defaultParams: { duration: 15 },
    params: [
      { key: "prompt", label: "Prompt", type: "textarea", required: true, description: "Describe the music style and instruments" },
      { key: "duration", label: "Duration (seconds)", type: "slider", min: 1, max: 30, step: 1, default: 15 },
      { key: "model_version", label: "Model", type: "select", default: "stereo-large", options: [{ value: "stereo-large", label: "Large (Stereo)" }, { value: "stereo-medium", label: "Medium (Stereo)" }, { value: "mono-large", label: "Large (Mono)" }] },
      SEED,
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getModelById(id: string): FalModelConfig | undefined {
  return FAL_MODELS.find((m) => m.id === id);
}

export function getModelsByType(modelType: ModelType): FalModelConfig[] {
  return FAL_MODELS.filter((m) => m.modelType === modelType);
}

export function getModelsByCategory(category: string): FalModelConfig[] {
  return FAL_MODELS.filter((m) => m.category === category);
}

export function getModelCategories(modelType?: ModelType): string[] {
  const models = modelType ? FAL_MODELS.filter((m) => m.modelType === modelType) : FAL_MODELS;
  return [...new Set(models.map((m) => m.category))];
}

/** Group models by modelType for the studio browser */
export function getModelsByGroup(): Record<string, FalModelConfig[]> {
  const groups: Record<string, FalModelConfig[]> = {};
  for (const model of FAL_MODELS) {
    if (!groups[model.modelType]) groups[model.modelType] = [];
    groups[model.modelType].push(model);
  }
  return groups;
}

export const MODEL_TYPE_LABELS: Record<ModelType, string> = {
  TEXT_TO_IMAGE: "Text → Image",
  IMAGE_TO_IMAGE: "Image → Image",
  TEXT_TO_VIDEO: "Text → Video",
  IMAGE_TO_VIDEO: "Image → Video",
  UPSCALE: "Upscale",
  IMAGE_EDIT: "Edit",
  AUDIO: "Audio",
  MUSIC: "Music",
};
