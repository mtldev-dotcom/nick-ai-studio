import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { submitFalJob, getModelById } from "@/lib/fal";
import { getAssetType } from "@/lib/models";
import { decrypt } from "@/lib/encryption";
import { generateJobSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validation = generateJobSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { model, prompt, negativePrompt, seed, params, parentId, imageUrls } = validation.data;

    const modelConfig = getModelById(model);
    if (!modelConfig) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    const credentials = await prisma.credentials.findUnique({ where: { userId } });
    if (!credentials?.falApiKeyEnc) {
      return NextResponse.json({ error: "Fal.ai API key not configured. Go to Settings." }, { status: 400 });
    }

    const falApiKey = decrypt(credentials.falApiKeyEnc);
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/fal`;

    // Derive the job's asset type from the model config
    const rawAssetType = getAssetType(modelConfig.modelType);
    // DB only supports IMAGE | VIDEO — map AUDIO to IMAGE for now
    const dbAssetType: "IMAGE" | "VIDEO" = rawAssetType === "VIDEO" ? "VIDEO" : "IMAGE";

    // Build the flat snake_case params map for Fal.ai
    // Priority: model defaults → extra params → explicit top-level fields
    const falParams: Record<string, unknown> = {
      prompt,
      ...(negativePrompt ? { negative_prompt: negativePrompt } : {}),
      ...(seed !== undefined ? { seed } : {}),
      ...((params ?? {}) as Record<string, unknown>),
      // Legacy: imageUrls from old form path
      ...(imageUrls && imageUrls.length > 0 ? { image_urls: imageUrls } : {}),
    };

    // For image-to-video via parentId: resolve parent image to a presigned URL
    // and inject as image_url (unless already provided in params)
    if (parentId && !falParams.image_url) {
      const parentJob = await prisma.job.findUnique({ where: { id: parentId } });
      if (parentJob?.r2Key && credentials.r2AccessKeyEnc && credentials.r2SecretKeyEnc) {
        try {
          const r2Config = {
            accessKeyId: decrypt(credentials.r2AccessKeyEnc),
            secretAccessKey: decrypt(credentials.r2SecretKeyEnc),
            endpoint: credentials.r2Endpoint ?? "",
            bucketName: credentials.r2BucketName ?? "",
          };
          const { createR2Client, getPresignedUrl } = await import("@/lib/r2");
          const r2Client = createR2Client(r2Config);
          falParams.image_url = await getPresignedUrl(
            r2Client,
            r2Config.bucketName,
            parentJob.r2Key,
            3600
          );
        } catch {
          // Non-fatal: proceed without the presigned URL
        }
      }
    }

    const job = await prisma.job.create({
      data: {
        userId,
        type: dbAssetType,
        model,
        prompt,
        negativePrompt,
        seed,
        params: (params ?? {}) as object,
        status: "PROCESSING",
        parentId: parentId ?? null,
      },
    });

    try {
      const falResponse = await submitFalJob(falApiKey, model, falParams, webhookUrl);
      await prisma.job.update({
        where: { id: job.id },
        data: { falRequestId: falResponse.requestId },
      });
    } catch (falError) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "FAL_FAILED",
          errorMessage: falError instanceof Error ? falError.message : "Failed to submit to Fal.ai",
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ jobId: job.id, status: job.status });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
