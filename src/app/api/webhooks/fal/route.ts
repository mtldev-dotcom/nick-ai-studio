import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { createR2Client, buildR2Key } from "@/lib/r2";
import { validateFalSignature } from "@/lib/fal";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-fal-signature");
    const webhookSecret = process.env.FAL_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const rawBody = await request.text();
    
    if (signature) {
      const isValid = validateFalSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    
    const { request_id, status, output, error } = payload;
    
    if (!request_id) {
      return NextResponse.json({ error: "Missing request_id" }, { status: 400 });
    }

    const job = await prisma.job.findFirst({
      where: { falRequestId: request_id },
      include: { user: { include: { credentials: true } } },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status === "COMPLETE") {
      return NextResponse.json({ message: "Job already processed" }, { status: 200 });
    }

    if (status === "COMPLETED") {
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
        
        const tempUrl = output?.images?.[0]?.url || output?.video?.url;
        const contentType = output?.images?.[0]?.contentType || output?.video?.contentType || "image/png";
        const filename = output?.images?.[0]?.filename || output?.video?.filename || `${job.id}.png`;

        if (!tempUrl) {
          throw new Error("No output URL in Fal response");
        }

        const response = await fetch(tempUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        
        const r2Key = buildR2Key(job.userId, job.id, filename);
        
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

        return NextResponse.json({ message: "Asset uploaded successfully" }, { status: 200 });
      } catch (uploadError) {
        const errorMessage = uploadError instanceof Error ? uploadError.message : "Upload failed";
        
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

    if (status === "FAILED") {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "FAL_FAILED",
          errorMessage: error?.message || "Generation failed",
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
