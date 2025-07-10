import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const SECRET_KEY = Buffer.from(process.env.ENCRYPTION_SECRET!, "hex") // 32-byte (64 hex characters)

export function encryptFile(buffer: Buffer): { encryptedData: Buffer; iv: string; tag: string } {
  const iv = crypto.randomBytes(12) // 12 bytes for GCM mode
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv)

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  }
}

export function decryptFile(encryptedData: Buffer, iv: string, tag: string): Buffer {
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(iv, "hex"))
  decipher.setAuthTag(Buffer.from(tag, "hex"))

  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ])

  return decrypted
}
