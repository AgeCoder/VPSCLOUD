// lib/r2Client.ts

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { dblocal } from "@/lib/localdb"
import { settings } from "@/lib/localdb/schema"
import { inArray } from "drizzle-orm"

// Step 1: Fetch credentials from DB
async function getR2Credentials() {
  const keys = [
    "CLOUDFLARE_R2_ENDPOINT",
    "CLOUDFLARE_R2_ACCESS_KEY_ID",
    "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
    "CLOUDFLARE_R2_BUCKET_NAME"
  ]

  const result = await dblocal
    .select()
    .from(settings)
    .where(inArray(settings.key, keys))

  const settingMap = Object.fromEntries(result.map((r) => [r.key, r.value]))

  const endpoint = settingMap["CLOUDFLARE_R2_ENDPOINT"]
  const accessKeyId = settingMap["CLOUDFLARE_R2_ACCESS_KEY_ID"]
  const secretAccessKey = settingMap["CLOUDFLARE_R2_SECRET_ACCESS_KEY"]
  const bucketName = settingMap["CLOUDFLARE_R2_BUCKET_NAME"]

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("Missing one or more R2 credentials in settings table")
  }

  return { endpoint, accessKeyId, secretAccessKey, bucketName }
}

// Step 2: Create the S3 client dynamically
async function createR2Client() {
  const { endpoint, accessKeyId, secretAccessKey } = await getR2Credentials()

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  })
}

// Step 3: Upload file
export async function uploadToR2(key: string, buffer: Buffer, contentType: string) {
  const client = await createR2Client()
  const { bucketName } = await getR2Credentials()

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType
  })

  return await client.send(command)
}

// Step 4: Get signed download URL
export async function getSignedDownloadUrl(key: string): Promise<string> {
  const client = await createR2Client()
  const { bucketName } = await getR2Credentials()

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key
  })

  return await getSignedUrl(client, command, { expiresIn: 300 }) // 5 minutes
}

// Step 5: Delete file
export async function deleteFromR2(key: string) {
  const client = await createR2Client()
  const { bucketName } = await getR2Credentials()

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key
  })

  return await client.send(command)
}
