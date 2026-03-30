import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { decrypt } from "./encryption";

export interface R2Config {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucketName: string;
}

export function createR2Client(encryptedConfig: {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucketName: string;
}): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: encryptedConfig.endpoint,
    credentials: {
      accessKeyId: encryptedConfig.accessKeyId,
      secretAccessKey: encryptedConfig.secretAccessKey,
    },
  });
}

export async function uploadToR2(
  client: S3Client,
  bucketName: string,
  key: string,
  body: Buffer | Readable,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  
  await client.send(command);
}

export async function getPresignedUrl(
  client: S3Client,
  bucketName: string,
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  
  return getSignedUrl(client, command, { expiresIn });
}

export async function validateR2Credentials(config: R2Config): Promise<boolean> {
  try {
    const client = createR2Client(config);
    await client.send(new HeadBucketCommand({ Bucket: config.bucketName }));
    return true;
  } catch {
    return false;
  }
}

export function buildR2Key(userId: string, jobId: string, filename: string): string {
  return `${userId}/${jobId}/${filename}`;
}
