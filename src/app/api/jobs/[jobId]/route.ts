import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId } = await auth();
    
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

    return NextResponse.json({
      id: job.id,
      status: job.status,
      type: job.type,
      model: job.model,
      prompt: job.prompt,
      r2Key: job.r2Key,
      fallbackUrl: job.status === "UPLOAD_FAILED" ? job.fallbackUrl : null,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    console.error("Job fetch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
