import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { decrypt } from "@/lib/encryption";
import { createR2Client, getPresignedUrl } from "@/lib/r2";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "jobId required" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId, userId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!job.r2Key) {
      return NextResponse.json({ error: "Asset not available" }, { status: 404 });
    }

    const credentials = await prisma.credentials.findUnique({
      where: { userId },
    });

    if (!credentials) {
      return NextResponse.json({ error: "Credentials not found" }, { status: 404 });
    }

    const r2Config = {
      accessKeyId: decrypt(credentials.r2AccessKeyEnc || ""),
      secretAccessKey: decrypt(credentials.r2SecretKeyEnc || ""),
      endpoint: credentials.r2Endpoint || "",
      bucketName: credentials.r2BucketName || "",
    };

    const r2Client = createR2Client(r2Config);
    const presignedUrl = await getPresignedUrl(r2Client, r2Config.bucketName, job.r2Key, 3600);

    return NextResponse.json({ url: presignedUrl });
  } catch (error) {
    console.error("Asset URL error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
