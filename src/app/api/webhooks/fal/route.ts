import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { createR2Client, buildR2Key } from "@/lib/r2";
import { validateFalSignature } from "@/lib/fal";

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.FAL_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-fal-signature") || "";

    // Validate webhook signature
    const isValid = validateFalSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error("Fal webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    
    // fal.ai queue webhook format
    const requestId = payload.request_id || payload.requestId;
    const reqStatus = payload.status;
    const output = payload.output;
    const error = payload.error;
    
    if (!requestId) {
      console.error("Fal webhook: missing request_id in payload");
      return NextResponse.json({ error: "Missing request_id" }, { status: 400 });
    }

    const job = await prisma.job.findFirst({
      where: { falRequestId: requestId },
      include: { user: { include: { credentials: true } } },
    });

    if (!job) {
      console.error(`Fal webhook: job not found for request_id ${requestId}`);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status === "COMPLETE") {
      return NextResponse.json({ message: "Job already processed" }, { status: 200 });
    }

    if (reqStatus === "COMPLETED") {
      const credentials = job.user.credentials;
      
      if (!credentials || !credentials.r2AccessKeyEnc || !credentials.r2SecretKeyEnc) {
        await prisma.job.update({
          where: { id: job.id },
          data: { 
            status: "UPLOAD_FAILED",
            errorMessage: "R2 credentials not configured",
            completedAt: new Date(),
          },
        });
        return NextResponse.json({ message: "Credentials missing" }, { status: 200 });
      }

      try {
        const r2Config = {
          accessKeyId: decrypt(credentials.r2AccessKeyEnc),
          secretAccessKey: decrypt(credentials.r2SecretKeyEnc),
          endpoint: credentials.r2Endpoint || "",
          bucketName: credentials.r2BucketName || "",
        };

        const r2Client = createR2Client(r2Config);
        
        // Handle different output formats from fal.ai models
        // Image models: output.images[].url
        // Video models: output.video.url or output.videos[].url
        const imageData = output?.images?.[0];
        const videoData = output?.video || output?.videos?.[0];
        const tempUrl = imageData?.url || videoData?.url;
        
        if (!tempUrl) {
          console.error("Fal webhook: no output URL found", JSON.stringify(output, null, 2));
          throw new Error("No output URL in Fal response");
        }

        const contentType = imageData?.contentType || videoData?.contentType || (videoData ? "video/mp4" : "image/png");
        const filename = imageData?.filename || videoData?.filename || `${job.id}.${videoData ? "mp4" : "png"}`;
        const extension = filename.split(".").pop() || "png";

        console.log(`Fal webhook: downloading from ${tempUrl} for job ${job.id}`);

        const downloadResponse = await fetch(tempUrl);
        if (!downloadResponse.ok) {
          throw new Error(`Failed to download asset: ${downloadResponse.status} ${downloadResponse.statusText}`);
        }
        const buffer = Buffer.from(await downloadResponse.arrayBuffer());
        
        const r2Key = buildR2Key(job.userId, job.id, `${job.id}.${extension}`);
        
        const { uploadToR2 } = await import("@/lib/r2");
        await uploadToR2(r2Client, r2Config.bucketName, r2Key, buffer, contentType);

        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: "COMPLETE",
            r2Key,
            completedAt: new Date(),
          },
        });

        console.log(`Fal webhook: asset uploaded to R2: ${r2Key}`);
        return NextResponse.json({ message: "Asset uploaded successfully" }, { status: 200 });
      } catch (uploadError) {
        const errorMessage = uploadError instanceof Error ? uploadError.message : "Upload failed";
        console.error(`Fal webhook: upload failed for job ${job.id}:`, errorMessage);
        
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: "UPLOAD_FAILED",
            fallbackUrl: output?.images?.[0]?.url || output?.video?.url,
            errorMessage,
            completedAt: new Date(),
          },
        });

        return NextResponse.json({ message: "Upload failed, marked for retry" }, { status: 200 });
      }
    }

    if (reqStatus === "FAILED") {
      const errorMsg = error?.message || error?.error_message || "Generation failed";
      console.error(`Fal webhook: job ${job.id} failed:`, errorMsg);
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "FAL_FAILED",
          errorMessage: errorMsg,
          completedAt: new Date(),
        },
      });
      return NextResponse.json({ message: "Job marked as failed" }, { status: 200 });
    }

    return NextResponse.json({ message: "Status updated" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}