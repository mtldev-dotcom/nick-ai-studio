import crypto from "crypto";

export interface FalModelConfig {
  id: string;
  name: string;
  type: "IMAGE" | "VIDEO";
  defaultParams: Record<string, unknown>;
  supportedParams: string[];
}

export const FAL_MODELS: FalModelConfig[] = [
  {
    id: "fal-ai/flux-pro",
    name: "Flux 1.0 Pro",
    type: "IMAGE",
    defaultParams: {},
    supportedParams: ["prompt", "negativePrompt", "seed", "guidanceScale", "numInferenceSteps", "aspectRatio"],
  },
  {
    id: "fal-ai/flux-dev",
    name: "Flux 1.0 Dev",
    type: "IMAGE",
    defaultParams: {},
    supportedParams: ["prompt", "negativePrompt", "seed", "guidanceScale", "numInferenceSteps", "aspectRatio"],
  },
  {
    id: "fal-ai/sdxl",
    name: "SDXL",
    type: "IMAGE",
    defaultParams: {},
    supportedParams: ["prompt", "negativePrompt", "seed", "guidanceScale", "numInferenceSteps", "aspectRatio"],
  },
  {
    id: "fal-ai/stable-video-diffusion",
    name: "Stable Video Diffusion",
    type: "VIDEO",
    defaultParams: {},
    supportedParams: ["prompt", "firstFrameImage", "seed", "motionMagnitude"],
  },
];

export function getModelById(modelId: string): FalModelConfig | undefined {
  return FAL_MODELS.find((m) => m.id === modelId);
}

export function getModelsByType(type: "IMAGE" | "VIDEO"): FalModelConfig[] {
  return FAL_MODELS.filter((m) => m.type === type);
}

export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  seed?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  aspectRatio?: string;
  firstFrameImage?: string;
  motionMagnitude?: number;
}

export async function submitFalJob(
  apiKey: string,
  modelId: string,
  params: GenerationParams,
  webhookUrl: string
): Promise<{ requestId: string }> {
  const model = getModelById(modelId);
  if (!model) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const payload: Record<string, unknown> = {
    ...params,
    webhookUrl,
  };

  const response = await fetch(`https://queue.fal.run/${modelId}`, {
    method: "POST",
    headers: {
      "Authorization": `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fal.ai API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function validateFalApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://queue.fal.run/fal-ai/flux-pro", {
      method: "POST",
      headers: {
        "Authorization": `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: "test" }),
    });
    return response.status !== 401;
  } catch {
    return false;
  }
}

export function validateFalSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
