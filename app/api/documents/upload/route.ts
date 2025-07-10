// import { type NextRequest, NextResponse } from "next/server"
// import { auth } from "@/lib/auth"
// import { db } from "@/lib/db"
// import { documents, accessLogs, changeLog } from "@/lib/db/schema"
// import { uploadToR2 } from "@/lib/r2"
// import { encryptFile } from "@/lib/encryption"
// import { getBranchZone } from "@/lib/zones"
// import { v4 as uuidv4 } from "uuid"

// export async function POST(request: NextRequest) {
//   try {
//     const session = await auth()

//     if (!session) {
//       return NextResponse.redirect(new URL("/login"))
//     }

//     if (!session?.user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     let branch
//     let zone

//     const formData = await request.formData()

//     if (session.user.role === "admin") {
//       branch = formData.get("branch") as string
//       zone = formData.get("zone") as string
//     } else {
//       branch = session.user.branch
//       zone = getBranchZone(session.user.branch!)
//     }

//     const files = Array.from(formData.entries())
//       .filter(([key]) => key.startsWith("file"))
//       .map(([, value]) => value as File)

//     if (files.length === 0) {
//       return NextResponse.json({ error: "No files provided" }, { status: 400 })
//     }

//     const allowedTypes = [
//       "application/pdf",
//       "image/jpeg",
//       "image/png",
//       "image/gif",
//       "image/bmp",
//       "image/webp",
//       "image/tiff",
//       "image/svg+xml",
//       "image/heif",
//       "image/heic",
//       "image/x-icon",
//     ]
//     const documentIds: string[] = []

//     for (const file of files) {
//       if (!allowedTypes.includes(file.type)) {
//         return NextResponse.json(
//           {
//             error: `File ${file.name} must be a PDF or an image (JPEG, PNG, GIF, BMP, WebP, TIFF, SVG, HEIF, HEIC, ICO)`,
//           },
//           { status: 400 }
//         )
//       }

//       const buffer = Buffer.from(await file.arrayBuffer())
//       const { encryptedData, iv, tag } = encryptFile(buffer)

//       const fileId = uuidv4()
//       const r2Key = `${branch}/${fileId}-${file.name}`

//       await uploadToR2(r2Key, encryptedData, "application/octet-stream")

//       if (!zone) {
//         return NextResponse.json({ error: "Invalid branch or zone" }, { status: 400 })
//       }

//       const [document] = await db
//         .insert(documents)
//         .values({
//           id: fileId,
//           filename: `${fileId}-${file.name}`,
//           originalFilename: file.name,
//           branch: branch!,
//           zone,
//           uploadedBy: session.user.id,
//           r2Key,
//           iv,
//           tag,
//           uploadedAt: new Date(),
//           updatedAt: new Date(),
//         })
//         .returning()

//       await db.insert(accessLogs).values({
//         userId: session.user.id,
//         fileId: document.id,
//         action: "upload",
//       })

//       await db.insert(changeLog).values({
//         documentId: document.id,
//         changeType: "insert",
//         changedAt: new Date(),
//       })

//       documentIds.push(document.id)
//     }

//     return NextResponse.json({ success: true, documentIds })
//   } catch (error) {
//     console.error("Upload error:", error)
//     return NextResponse.json({ error: "Upload failed" }, { status: 500 })
//   }
// }

import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { documents, accessLogs, changeLog } from "@/lib/db/schema"
import { uploadToR2 } from "@/lib/r2"
import { encryptFile } from "@/lib/encryption"
import { getBranchZone } from "@/lib/zones"
import { v4 as uuidv4 } from "uuid"

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

    if (session.user.role === "admin") {
      branch = formData.get("branch") as string
      zone = formData.get("zone") as string
    } else {
      branch = session.user.branch
      zone = getBranchZone(session.user.branch!)
    }

    const files = Array.from(formData.entries())
      .filter(([key]) => key.startsWith("file"))
      .map(([, value]) => value as File)

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

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
      "image/x-icon",
    ]
    const documentIds: string[] = []

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error: `File ${file.name} must be a PDF or an image (JPEG, PNG, GIF, BMP, WebP, TIFF, SVG, HEIF, HEIC, ICO)`,
          },
          { status: 400 }
        )
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const { encryptedData, iv, tag } = encryptFile(buffer)

      const fileId = uuidv4()
      const r2Key = `${branch}/${fileId}-${file.name}`

      await uploadToR2(r2Key, encryptedData, "application/octet-stream")

      if (!zone) {
        return NextResponse.json({ error: "Invalid branch or zone" }, { status: 400 })
      }

      const [document] = await db
        .insert(documents)
        .values({
          id: fileId,
          filename: `${fileId}-${file.name}`,
          originalFilename: file.name,
          branch: branch!,
          zone,
          uploadedBy: session.user.id,
          r2Key,
          iv,
          tag,
          uploadedAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      await db.insert(accessLogs).values({
        userId: session.user.id,
        fileId: document.id,
        action: "upload",
      })

      await db.insert(changeLog).values({
        documentId: document.id,
        changeType: "insert",
        changedAt: new Date(),
      })

      documentIds.push(document.id)
    }

    return NextResponse.json({ success: true, documentIds })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}