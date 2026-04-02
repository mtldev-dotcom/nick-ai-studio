import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";
import { createR2Client } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = request.nextUrl.searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json({ error: "jobId required" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId, userId },
      select: { r2Key: true, type: true, prompt: true },
    });

    if (!job?.r2Key) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const credentials = await prisma.credentials.findUnique({ where: { userId } });
    if (!credentials?.r2AccessKeyEnc || !credentials?.r2SecretKeyEnc) {
      return NextResponse.json({ error: "R2 not configured" }, { status: 400 });
    }

    const r2Client = createR2Client({
      accessKeyId: decrypt(credentials.r2AccessKeyEnc),
      secretAccessKey: decrypt(credentials.r2SecretKeyEnc),
      endpoint: credentials.r2Endpoint ?? "",
      bucketName: credentials.r2BucketName ?? "",
    });

    const ext = job.r2Key.split(".").pop() ?? (job.type === "VIDEO" ? "mp4" : "jpg");
    const filename = `${jobId}.${ext}`;

    const command = new GetObjectCommand({
      Bucket: credentials.r2BucketName ?? "",
      Key: job.r2Key,
    });

    const s3Response = await r2Client.send(command);
    if (!s3Response.Body) {
      return NextResponse.json({ error: "Empty response from R2" }, { status: 500 });
    }

    // Stream R2 body → Response
    const contentType = s3Response.ContentType ?? (job.type === "VIDEO" ? "video/mp4" : "image/jpeg");
    const chunks: Uint8Array[] = [];
    for await (const chunk of s3Response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.byteLength.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
