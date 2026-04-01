import crypto from "crypto";
import { fal } from "@fal-ai/client";
import { FAL_MODELS, getModelById, getModelsByType, type FalModelConfig } from "./models";

// Re-export from unified model catalog
export { FAL_MODELS, getModelById, getModelsByType, type FalModelConfig };

export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  seed?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  aspectRatio?: string;
  firstFrameImage?: string;
  motionMagnitude?: number;
  [key: string]: unknown;
}

/**
 * Configure the Fal client with the user's API key
 */
function configureFalClient(apiKey: string) {
  fal.config({
    credentials: apiKey,
  });
}

/**
 * Submit a job to Fal.ai queue using the official SDK
 */
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

  configureFalClient(apiKey);

  // Build input from params, merging with model defaults
  const input: Record<string, unknown> = {
    ...model.defaultParams,
    prompt: params.prompt,
  };

  // Map common params to fal.ai format
  if (params.negativePrompt) input.negative_prompt = params.negativePrompt;
  if (params.seed !== undefined) input.seed = params.seed;
  if (params.guidanceScale !== undefined) input.guidance_scale = params.guidanceScale;
  if (params.numInferenceSteps !== undefined) input.num_inference_steps = params.numInferenceSteps;
  if (params.aspectRatio) input.aspect_ratio = params.aspectRatio;
  if (params.firstFrameImage) input.first_frame_image = params.firstFrameImage;
  if (params.motionMagnitude !== undefined) input.motion_magnitude = params.motionMagnitude;

  // Add any additional params
  for (const [key, value] of Object.entries(params)) {
    if (!["prompt", "negativePrompt", "seed", "guidanceScale", "numInferenceSteps", "aspectRatio", "firstFrameImage", "motionMagnitude"].includes(key)) {
      input[key] = value;
    }
  }

  try {
    const result = await fal.queue.submit(modelId, {
      input,
      webhookUrl,
    });

    return { requestId: result.request_id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Fal.ai submission failed: ${message}`);
  }
}

/**
 * Check the status of a queued job
 */
export async function getFalJobStatus(
  apiKey: string,
  modelId: string,
  requestId: string
): Promise<{ status: string; logs?: string[] }> {
  configureFalClient(apiKey);

  try {
    const status = await fal.queue.status(modelId, {
      requestId,
      logs: true,
    });

    // Handle different status types
    const statusValue = status.status;
    let logs: string[] | undefined;

    // Check if logs are available (only in InProgressQueueStatus)
    if ("logs" in status && status.logs) {
      logs = status.logs.map((log: { message: string }) => log.message);
    }

    return {
      status: statusValue,
      logs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Fal.ai status check failed: ${message}`);
  }
}

/**
 * Get the result of a completed job
 */
export async function getFalJobResult(
  apiKey: string,
  modelId: string,
  requestId: string
): Promise<Record<string, unknown>> {
  configureFalClient(apiKey);

  try {
    const result = await fal.queue.result(modelId, {
      requestId,
    });

    return result.data as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Fal.ai result fetch failed: ${message}`);
  }
}

/**
 * Cancel a pending job
 */
export async function cancelFalJob(
  apiKey: string,
  modelId: string,
  requestId: string
): Promise<void> {
  configureFalClient(apiKey);

  try {
    await fal.queue.cancel(modelId, {
      requestId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Fal.ai cancellation failed: ${message}`);
  }
}

/**
 * Validate a Fal.ai API key by making a test request
 */
export async function validateFalApiKey(apiKey: string): Promise<boolean> {
  try {
    configureFalClient(apiKey);
    
    // Try to submit a minimal test request
    const result = await fal.queue.submit("fal-ai/flux/schnell", {
      input: { prompt: "test" },
    });
    
    // If we got a request_id, the key is valid
    // Cancel the test job immediately
    if (result.request_id) {
      try {
        await fal.queue.cancel("fal-ai/flux/schnell", {
          requestId: result.request_id,
        });
      } catch {
        // Ignore cancellation errors
      }
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Validate webhook signature from Fal.ai
 */
export function validateFalSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;
  
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}