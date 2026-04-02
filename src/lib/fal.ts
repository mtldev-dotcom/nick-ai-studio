import crypto from "crypto";
import { fal } from "@fal-ai/client";
import { getModelById } from "./models";

// Re-export helpers consumers need from this module
export { getModelById };

/**
 * Submit a generation job to Fal.ai queue.
 *
 * `userParams` is a flat snake_case map that comes straight from DynamicParamForm
 * (e.g. { prompt, negative_prompt, guidance_scale, image_size, first_frame_image, … }).
 * We merge model.defaultParams (lower priority) with userParams (higher priority)
 * so that models always have sensible defaults but users can override them.
 */
export async function submitFalJob(
  apiKey: string,
  modelId: string,
  userParams: Record<string, unknown>,
  webhookUrl: string
): Promise<{ requestId: string }> {
  const model = getModelById(modelId);
  if (!model) throw new Error(`Unknown model: ${modelId}`);

  fal.config({ credentials: apiKey });

  // Build the final Fal input: defaults first, user overrides second
  const input: Record<string, unknown> = {
    ...model.defaultParams,
    ...Object.fromEntries(
      Object.entries(userParams).filter(([, v]) => v !== undefined && v !== "" && v !== null)
    ),
  };

  try {
    const result = await fal.queue.submit(modelId, { input, webhookUrl });
    return { requestId: result.request_id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Fal.ai submission failed: ${message}`);
  }
}

/**
 * Check the status of a queued job.
 */
export async function getFalJobStatus(
  apiKey: string,
  modelId: string,
  requestId: string
): Promise<{ status: string; logs?: string[] }> {
  fal.config({ credentials: apiKey });

  try {
    const status = await fal.queue.status(modelId, { requestId, logs: true });
    let logs: string[] | undefined;
    if ("logs" in status && status.logs) {
      logs = (status.logs as Array<{ message: string }>).map((l) => l.message);
    }
    return { status: status.status, logs };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Fal.ai status check failed: ${message}`);
  }
}

/**
 * Retrieve the result of a completed job, with exponential-backoff retry.
 */
export async function getFalJobResult(
  apiKey: string,
  modelId: string,
  requestId: string,
  maxRetries = 3,
  retryDelay = 2000
): Promise<Record<string, unknown>> {
  fal.config({ credentials: apiKey });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fal.queue.result(modelId, { requestId });
      return result.data as Record<string, unknown>;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      if (lastError.message.includes("Not Found") && attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, retryDelay));
        retryDelay *= 1.5;
        continue;
      }
      throw new Error(`Fal.ai result fetch failed: ${lastError.message}`);
    }
  }

  throw new Error(`Fal.ai result fetch failed after ${maxRetries} attempts: ${lastError?.message ?? "unknown"}`);
}

/**
 * Cancel a pending or in-progress job.
 */
export async function cancelFalJob(
  apiKey: string,
  modelId: string,
  requestId: string
): Promise<void> {
  fal.config({ credentials: apiKey });
  try {
    await fal.queue.cancel(modelId, { requestId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Fal.ai cancellation failed: ${message}`);
  }
}

/**
 * Validate a Fal.ai API key by submitting a minimal test request then cancelling it.
 */
export async function validateFalApiKey(apiKey: string): Promise<boolean> {
  try {
    fal.config({ credentials: apiKey });
    const result = await fal.queue.submit("fal-ai/flux/schnell", {
      input: { prompt: "test" },
    });
    if (result.request_id) {
      fal.queue.cancel("fal-ai/flux/schnell", { requestId: result.request_id }).catch(() => {});
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Validate a Fal.ai webhook signature using HMAC-SHA256 with timing-safe comparison.
 */
export function validateFalSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;
  try {
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
