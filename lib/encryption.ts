// lib/crypto.ts
import crypto from "crypto"
import { dblocal } from "./localdb"
import { settings } from "./localdb/schema"
import { eq } from "drizzle-orm"

const ALGORITHM = "aes-256-gcm"
const KEY_LENGTH = 32 // 256 bits = 32 bytes

async function getSecretKey(): Promise<Buffer> {
  try {
    const result = await dblocal
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, "ENCRYPTION_SECRET"))
      .then(res => res[0]?.value)

    const secret = result || process.env.ENCRYPTION_SECRET

    if (!secret) throw new Error("No ENCRYPTION_SECRET found")

    // Derive 32‑byte key via SHA‑256
    const keyBuffer = crypto.createHash("sha256").update(secret, "utf8").digest()

    return keyBuffer
  } catch (err) {
    throw new Error(
      "Failed to load encryption secret: " +
      (err instanceof Error ? err.message : String(err))
    )
  }
}
export async function encryptFile(buffer: Buffer): Promise<{
  encryptedData: Buffer
  iv: string
  tag: string
}> {
  const key = await getSecretKey()

  const iv = crypto.randomBytes(12) // 96 bits for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  }
}

export async function decryptFile(
  encryptedData: Buffer,
  iv: string,
  tag: string
): Promise<Buffer> {
  const key = await getSecretKey()
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"))
  decipher.setAuthTag(Buffer.from(tag, "hex"))

  return Buffer.concat([decipher.update(encryptedData), decipher.final()])
}
