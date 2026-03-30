import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { encrypt, decrypt, maskSecret } from "@/lib/encryption";
import { validateR2Credentials } from "@/lib/r2";
import { validateFalApiKey } from "@/lib/fal";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const credentials = await prisma.credentials.findUnique({
      where: { userId },
    });

    if (!credentials) {
      return NextResponse.json({
        falApiKey: null,
        r2AccessKey: null,
        r2SecretKey: null,
        r2Endpoint: null,
        r2BucketName: null,
      });
    }

    return NextResponse.json({
      falApiKey: credentials.falApiKeyEnc ? maskSecret("sk-••••••••••••••••") : null,
      r2AccessKey: credentials.r2AccessKeyEnc ? maskSecret(decrypt(credentials.r2AccessKeyEnc)) : null,
      r2SecretKey: credentials.r2SecretKeyEnc ? maskSecret("••••••••••••••••") : null,
      r2Endpoint: credentials.r2Endpoint,
      r2BucketName: credentials.r2BucketName,
      updatedAt: credentials.updatedAt,
    });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { falApiKey, r2AccessKey, r2SecretKey, r2Endpoint, r2BucketName } = body;

    if (r2AccessKey && r2SecretKey && r2Endpoint && r2BucketName) {
      const isValidR2 = await validateR2Credentials({
        accessKeyId: r2AccessKey,
        secretAccessKey: r2SecretKey,
        endpoint: r2Endpoint,
        bucketName: r2BucketName,
      });

      if (!isValidR2) {
        return NextResponse.json({ error: "Invalid R2 credentials" }, { status: 400 });
      }
    }

    if (falApiKey) {
      const isValidFal = await validateFalApiKey(falApiKey);
      if (!isValidFal) {
        return NextResponse.json({ error: "Invalid Fal.ai API key" }, { status: 400 });
      }
    }

    const credentials = await prisma.credentials.upsert({
      where: { userId },
      create: {
        userId,
        falApiKeyEnc: falApiKey ? encrypt(falApiKey) : null,
        r2AccessKeyEnc: r2AccessKey ? encrypt(r2AccessKey) : null,
        r2SecretKeyEnc: r2SecretKey ? encrypt(r2SecretKey) : null,
        r2Endpoint: r2Endpoint || null,
        r2BucketName: r2BucketName || null,
      },
      update: {
        falApiKeyEnc: falApiKey ? encrypt(falApiKey) : undefined,
        r2AccessKeyEnc: r2AccessKey ? encrypt(r2AccessKey) : undefined,
        r2SecretKeyEnc: r2SecretKey ? encrypt(r2SecretKey) : undefined,
        r2Endpoint: r2Endpoint || null,
        r2BucketName: r2BucketName || null,
      },
    });

    return NextResponse.json({
      success: true,
      falApiKey: credentials.falApiKeyEnc ? maskSecret("sk-••••••••••••••••") : null,
      r2AccessKey: credentials.r2AccessKeyEnc ? maskSecret("••••••••••••••••") : null,
      r2SecretKey: credentials.r2SecretKeyEnc ? maskSecret("••••••••••••••••") : null,
      r2Endpoint: credentials.r2Endpoint,
      r2BucketName: credentials.r2BucketName,
    });
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
