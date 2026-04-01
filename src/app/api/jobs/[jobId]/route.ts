import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";
import { getFalJobStatus, getFalJobResult, cancelFalJob } from "@/lib/fal";
import { createR2Client, buildR2Key } from "@/lib/r2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    const job = await prisma.job.findUnique({
      where: { id: jobId, userId },
      select: {
        id: true,
        status: true,
        type: true,
        model: true,
        prompt: true,
        negativePrompt: true,
        seed: true,
        params: true,
        r2Key: true,
        fallbackUrl: true,
        errorMessage: true,
        createdAt: true,
        completedAt: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Polling fallback for localhost development
    // If job is still PROCESSING and has a falRequestId, check fal.ai status directly
    if (job.status === "PROCESSING") {
      const jobWithFalId = await prisma.job.findUnique({
        where: { id: jobId },
        select: { falRequestId: true, model: true },
      });

      if (jobWithFalId?.falRequestId) {
        try {
          const credentials = await prisma.credentials.findUnique({
            where: { userId },
          });

          if (credentials?.falApiKeyEnc) {
            const falApiKey = decrypt(credentials.falApiKeyEnc);
            const falStatus = await getFalJobStatus(falApiKey, jobWithFalId.model, jobWithFalId.falRequestId);

            if (falStatus.status === "COMPLETED") {
              // Add a small delay before fetching result to allow Fal.ai to prepare it
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              try {
                // Fetch the result and update the job
                const falResult = await getFalJobResult(falApiKey, jobWithFalId.model, jobWithFalId.falRequestId);
                
                // Handle different output formats from fal.ai models
                const imageData = (falResult as any)?.images?.[0];
                const videoData = (falResult as any)?.video || (falResult as any)?.videos?.[0];
                const tempUrl = imageData?.url || videoData?.url;

                if (tempUrl && credentials.r2AccessKeyEnc && credentials.r2SecretKeyEnc) {
                  try {
                    const r2Config = {
                      accessKeyId: decrypt(credentials.r2AccessKeyEnc),
                      secretAccessKey: decrypt(credentials.r2SecretKeyEnc),
                      endpoint: credentials.r2Endpoint || "",
                      bucketName: credentials.r2BucketName || "",
                    };

                    const r2Client = createR2Client(r2Config);
                    const contentType = imageData?.contentType || videoData?.contentType || (videoData ? "video/mp4" : "image/png");
                    const filename = imageData?.filename || videoData?.filename || `${job.id}.${videoData ? "mp4" : "png"}`;
                    const extension = filename.split(".").pop() || "png";

                    // Download the asset
                    const downloadResponse = await fetch(tempUrl);
                    if (downloadResponse.ok) {
                      const buffer = Buffer.from(await downloadResponse.arrayBuffer());
                      const r2Key = buildR2Key(userId, job.id, `${job.id}.${extension}`);
                      
                      const { uploadToR2 } = await import("@/lib/r2");
                      await uploadToR2(r2Client, r2Config.bucketName, r2Key, buffer, contentType);

                      // Update job status to COMPLETE
                      await prisma.job.update({
                        where: { id: job.id },
                        data: {
                          status: "COMPLETE",
                          r2Key,
                          completedAt: new Date(),
                        },
                      });

                      // Return updated job
                      const updatedJob = await prisma.job.findUnique({
                        where: { id: jobId, userId },
                        select: {
                          id: true,
                          status: true,
                          type: true,
                          model: true,
                          prompt: true,
                          negativePrompt: true,
                          seed: true,
                          params: true,
                          r2Key: true,
                          fallbackUrl: true,
                          errorMessage: true,
                          createdAt: true,
                          completedAt: true,
                        },
                      });

                      return NextResponse.json(updatedJob);
                    }
                  } catch (uploadError) {
                    console.error("Polling fallback: upload failed:", uploadError);
                  }
                }
              } catch (resultError) {
                // Result not available yet - this can happen if status shows COMPLETED but result isn't ready
                console.log("Fal.ai result not ready yet, will retry on next poll:", resultError instanceof Error ? resultError.message : "Unknown error");
                // Continue with original job data, will retry on next poll
              }
            } else if (falStatus.status === "FAILED") {
              // Update job status to FAL_FAILED
              await prisma.job.update({
                where: { id: job.id },
                data: {
                  status: "FAL_FAILED",
                  errorMessage: "Generation failed",
                  completedAt: new Date(),
                },
              });

              const updatedJob = await prisma.job.findUnique({
                where: { id: jobId, userId },
                select: {
                  id: true,
                  status: true,
                  type: true,
                  model: true,
                  prompt: true,
                  negativePrompt: true,
                  seed: true,
                  params: true,
                  r2Key: true,
                  fallbackUrl: true,
                  errorMessage: true,
                  createdAt: true,
                  completedAt: true,
                },
              });

              return NextResponse.json(updatedJob);
            }
          }
        } catch (error) {
          console.error("Polling fallback error:", error);
          // Continue with original job data if polling fails
        }
      }
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Job detail error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const body = await request.json();

    const job = await prisma.job.findUnique({
      where: { id: jobId, userId },
      select: {
        id: true,
        status: true,
        model: true,
        falRequestId: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Handle cancel action
    if (body.action === "cancel") {
      if (job.status !== "PENDING" && job.status !== "PROCESSING") {
        return NextResponse.json({ error: "Job cannot be cancelled" }, { status: 400 });
      }

      // Cancel the job on Fal.ai if it has a request ID
      if (job.falRequestId) {
        try {
          const credentials = await prisma.credentials.findUnique({
            where: { userId },
          });

          if (credentials?.falApiKeyEnc) {
            const falApiKey = decrypt(credentials.falApiKeyEnc);
            await cancelFalJob(falApiKey, job.model, job.falRequestId);
          }
        } catch (error) {
          // Log but don't fail - job might already be completed/cancelled or request ID invalid
          console.log("Fal.ai cancellation skipped (job may already be finished):", error instanceof Error ? error.message : "Unknown error");
        }
      }

      // Update job status to CANCELLED
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "CANCELLED",
          completedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, status: "CANCELLED" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Job update error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    const job = await prisma.job.findUnique({
      where: { id: jobId, userId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await prisma.job.delete({
      where: { id: jobId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Job delete error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}