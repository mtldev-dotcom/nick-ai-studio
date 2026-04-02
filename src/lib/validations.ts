import { z } from "zod";

// Job validation schemas
export const generateJobSchema = z.object({
  model: z.string().min(1, "Model is required"),
  prompt: z.string().min(1, "Prompt is required").max(4000, "Prompt too long"),
  negativePrompt: z.string().max(2000, "Negative prompt too long").optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
  params: z.record(z.string(), z.unknown()).optional(),
  parentId: z.string().uuid().optional(),
  imageUrls: z.array(z.string().url("Invalid image URL")).optional(),
});

export const jobIdSchema = z.object({
  jobId: z.string().uuid("Invalid job ID format"),
});

// Settings validation schemas
export const settingsSchema = z.object({
  falApiKey: z.string().min(1).optional(),
  r2AccessKey: z.string().min(1).optional(),
  r2SecretKey: z.string().min(1).optional(),
  r2Endpoint: z.string().url("Invalid endpoint URL").optional(),
  r2BucketName: z.string().min(1).max(63, "Bucket name too long").optional(),
});

// Jobs list query validation
export const jobsListSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  type: z.enum(["IMAGE", "VIDEO", "AUDIO"]).optional(),
  model: z.string().optional(),
  search: z.string().min(3).optional(),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETE", "UPLOAD_FAILED", "FAL_FAILED", "CANCELLED"]).optional(),
});

// Webhook validation
export const falWebhookSchema = z.object({
  request_id: z.string().optional(),
  requestId: z.string().optional(),
  status: z.enum(["COMPLETED", "FAILED", "IN_PROGRESS"]).optional(),
  output: z.unknown().optional(),
  error: z.unknown().optional(),
}).refine(
  (data) => data.request_id || data.requestId,
  { message: "Missing request_id" }
);

// Type exports
export type GenerateJobInput = z.infer<typeof generateJobSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type JobsListInput = z.infer<typeof jobsListSchema>;