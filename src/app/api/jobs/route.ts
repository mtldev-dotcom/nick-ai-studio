import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Job } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");
    const model = searchParams.get("model");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {
      userId,
      deletedAt: null,
    };

    if (type) {
      where.type = type;
    }

    if (model) {
      where.model = model;
    }

    if (search && search.length >= 3) {
      where.prompt = { contains: search, mode: "insensitive" };
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = jobs.length > limit;
    const items = hasMore ? jobs.slice(0, -1) : jobs;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      items: items.map((job: Job) => ({
        id: job.id,
        status: job.status,
        type: job.type,
        model: job.model,
        prompt: job.prompt,
        r2Key: job.r2Key,
        parentId: job.parentId,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      })),
      nextCursor,
    });
  } catch (error) {
    console.error("Jobs list error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
