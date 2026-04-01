import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";
import { createR2Client, uploadToR2 } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Supported: JPG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 10MB" },
        { status: 400 }
      );
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

    // Generate unique key for upload
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop() || "png";
    const key = `uploads/${userId}/${timestamp}-${randomId}.${extension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const r2Client = createR2Client(r2Config);
    await uploadToR2(r2Client, r2Config.bucketName, key, buffer, file.type);

    // Generate presigned URL for the uploaded file
    const { getPresignedUrl } = await import("@/lib/r2");
    const presignedUrl = await getPresignedUrl(r2Client, r2Config.bucketName, key, 3600);

    return NextResponse.json({ 
      url: presignedUrl,
      key: key,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}