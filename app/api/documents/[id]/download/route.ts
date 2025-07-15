import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { accessLogs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { deleteFromR2, getSignedDownloadUrl } from "@/lib/r2"
import { canAccessDocument } from "@/lib/access-control"
import { decryptFile } from "@/lib/encryption"
import path from "path"
import fs from "fs/promises"
import { existsSync } from "fs"
import { dblocal } from "@/lib/localdb"
import { documents } from "@/lib/localdb/schema"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const [document] = await dblocal.select().from(documents).where(eq(documents.id, id)).limit(1)
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const hasAccess = canAccessDocument(
      session.user.role,
      session.user.zone,
      session.user.branch,
      document.branch,
      document.zone,
    )

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Use originalFilename to preserve the correct file extension
    const fileExtension = path.extname(document.originalFilename)
    const localPath = path.join(process.cwd(), "public", "decrypted-files", `${document.filename}${fileExtension}`)
    const fileExists = existsSync(localPath)

    if (fileExists) {
      // If file exists locally, serve it
      console.log("Serving file from local storage")
      const publicUrl = `http://localhost:3000/decrypted-files/${document.filename}${fileExtension}`
      return NextResponse.redirect(publicUrl)
    }

    // Fetch, decrypt, and save
    const signedUrl = await getSignedDownloadUrl(document.r2Key)
    const response = await fetch(signedUrl)
    if (!response.ok) {
      return NextResponse.json({ error: "Remote file fetch failed" }, { status: 404 })
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const decrypted = await decryptFile(buffer, document.iv, document.tag)

    // Ensure folder exists
    await fs.mkdir(path.dirname(localPath), { recursive: true })

    // Save decrypted file
    await fs.writeFile(localPath, decrypted)

    // Log download
    await db.insert(accessLogs).values({
      userId: session.user.id,
      fileId: document.id,
      action: "download",
    })

    return NextResponse.redirect(`http://localhost:3000/decrypted-files/${document.filename}${fileExtension}`)
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}