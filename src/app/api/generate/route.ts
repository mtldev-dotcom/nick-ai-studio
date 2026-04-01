import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { submitFalJob, getModelById, type GenerationParams } from "@/lib/fal";
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
    
    // Validate input
    const validation = generateJobSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { model, prompt, negativePrompt, seed, params, parentId } = validation.data;

    const modelConfig = getModelById(model);
    if (!modelConfig) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    const credentials = await prisma.credentials.findUnique({
      where: { userId },
    });

    if (!credentials?.falApiKeyEnc) {
      return NextResponse.json({ error: "Fal.ai API key not configured" }, { status: 400 });
    }

    const falApiKey = decrypt(credentials.falApiKeyEnc);
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/fal`;

    const job = await prisma.job.create({
      data: {
        userId,
        type: modelConfig.type,
        model,
        prompt,
        negativePrompt,
        seed,
        params: (params || {}) as any,
        status: "PROCESSING",
        parentId,
      },
    });

    const falParams: GenerationParams = {
      prompt,
      ...(negativePrompt && { negativePrompt }),
      ...(seed && { seed }),
      ...((params || {}) as Partial<GenerationParams>),
    };

    if (parentId) {
      const parentJob = await prisma.job.findUnique({
        where: { id: parentId },
      });

      if (parentJob?.r2Key && modelConfig.type === "VIDEO") {
        const parentCredentials = await prisma.credentials.findUnique({
          where: { userId },
        });

        if (parentCredentials) {
          const r2Config = {
            accessKeyId: decrypt(parentCredentials.r2AccessKeyEnc || ""),
            secretAccessKey: decrypt(parentCredentials.r2SecretKeyEnc || ""),
            endpoint: parentCredentials.r2Endpoint || "",
            bucketName: parentCredentials.r2BucketName || "",
          };

          const { createR2Client, getPresignedUrl } = await import("@/lib/r2");
          const r2Client = createR2Client(r2Config);
          const presignedUrl = await getPresignedUrl(
            r2Client,
            r2Config.bucketName,
            parentJob.r2Key,
            3600
          );
          
          falParams.firstFrameImage = presignedUrl;
        }
      }
    }

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

    return NextResponse.json({ jobId: job.id, status: job.status }, { status: 200 });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}