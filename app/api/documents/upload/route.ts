import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"

import { documents, accessLogs, changeLog } from "@/lib/db/schema"
import { uploadToR2 } from "@/lib/cloudflare/r2"
import { getBranchZone } from "@/lib/auth/zones"
import { v4 as uuidv4 } from "uuid"
import { db } from "@/lib/db"
import { dblocal } from "@/lib/localdb"
import { documents as localdocuments, accessLogs as localaccessLogs, changeLog as localchangeLog } from "@/lib/localdb/schema"
import { encryptFile } from "@/lib/cloudflare/encryption"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.redirect(new URL("/login"))
    }

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let branch
    let zone

    const formData = await request.formData()

    if (session.user.role === "admin" || session.user.role === "zonal_head") {
      branch = formData.get("branch") as string
      zone = formData.get("zone") as string
    } else {
      branch = session.user.branch
      zone = await getBranchZone(session.user.branch!)
    }

    // Get additional metadata
    const year = formData.get("year") as string
    const docType = formData.get("type") as string
    const filetype = formData.get("filetype") as string

    // Get files properly from FormData
    const files: File[] = []
    for (const entry of formData.entries()) {
      const [key, value] = entry
      if (key.startsWith("file") && value instanceof Blob) {
        files.push(value as File)
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    // Allowed types with both MIME types and extensions
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/webp",
      "image/tiff",
      "image/svg+xml",
      "image/heif",
      "image/heic",
      "image/x-icon"
    ]

    const allowedExtensions = [
      '.pdf',
      '.jpg', '.jpeg',
      '.png',
      '.gif',
      '.bmp',
      '.webp',
      '.tiff', '.tif',
      '.svg',
      '.heif',
      '.heic',
      '.ico'
    ]

    const documentIds: number[] = []

    for (const file of files) {
      // Get file extension
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()

      // Check both MIME type and extension
      if (!allowedTypes.includes(file.type) && (!fileExt || !allowedExtensions.includes(fileExt))) {
        return NextResponse.json(
          {
            error: `File ${file.name} (type: ${file.type || 'unknown'}) must be a PDF or an image (JPEG, PNG, GIF, BMP, WebP, TIFF, SVG, HEIF, HEIC, ICO)`,
          },
          { status: 400 }
        )
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await encryptFile(buffer);
      const encryptedData = result?.encryptedData;
      const iv = result?.iv;
      const tag = result?.tag;


      const fileId = uuidv4()
      const r2Key = `${branch}/${fileId}-${file.name}`

      await uploadToR2(r2Key, encryptedData, "application/octet-stream")

      if (!zone) {
        return NextResponse.json({ error: "Invalid branch or zone" }, { status: 400 })
      }

      const [document] = await db
        .insert(documents)
        .values({
          filename: `${fileId}-${file.name}`,
          originalFilename: file.name,
          branch: branch!,
          zone,
          year,
          filetype: filetype || fileExt?.substring(1) || file.type.split('/')[1] || 'unknown',
          type: docType,
          uploadedBy: Number(session.user.id),
          r2Key,
          iv,
          tag,
          uploadedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning()


      const accessLog = await db.insert(accessLogs).values({
        userId: session.user.id,
        fileId: document.id,
        action: "upload",
        timestamp: new Date().toISOString(),
      }).returning()



      if (session.user.role === "admin" || session.user.branch == branch || session.user.zone === zone) {
        await dblocal.insert(localdocuments).values({
          id: document.id,
          filename: `${fileId}-${file.name}`,
          originalFilename: file.name,
          branch: branch!,
          zone,
          year,
          filetype: filetype || fileExt?.substring(1) || file.type.split('/')[1] || 'unknown',
          type: docType,
          uploadedBy: Number(session.user.id),
          r2Key,
          iv,
          tag,
          uploadedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        await dblocal.insert(localaccessLogs).values({
          id: accessLog[0].id,
          userId: Number(session.user.id),
          fileId: Number(document.id),
          action: accessLog[0].action,
          timestamp: accessLog[0].timestamp,
        });

      }


      documentIds.push(document.id)
    }

    return NextResponse.json({ success: true, documentIds })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}