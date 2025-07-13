import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { dblocal } from "@/lib/localdb"
import { documents, users } from "@/lib/db/schema"
import { documents as localDocuments } from "@/lib/localdb/schema"
import { count, desc, eq, inArray } from "drizzle-orm"
import { getAccessibleBranches } from "@/lib/access-control"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    const { id, role, zone, branch } = session.user

    if (!id || !role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessibleBranches = getAccessibleBranches(role, zone, branch)



    // Get documents from local DB (fallback to server if local fails)
    let userDocuments
    try {
      userDocuments = await dblocal
        .select({
          id: localDocuments.id,
          filename: localDocuments.filename,
          originalFilename: localDocuments.originalFilename,
          branch: localDocuments.branch,
          zone: localDocuments.zone,
          year: localDocuments.year,
          type: localDocuments.type,
          filetype: localDocuments.filetype,
          uploadedAt: localDocuments.uploadedAt,
          uploadedBy: localDocuments.uploadedBy,
        })
        .from(localDocuments)
        .where(inArray(localDocuments.branch, accessibleBranches))
        .orderBy(desc(localDocuments.uploadedAt))
        .all()

    } catch (localError) {

      console.warn('Falling back to server DB:', localError)
      userDocuments = await db
        .select({
          id: documents.id,
          filename: documents.filename,
          originalFilename: documents.originalFilename,
          branch: documents.branch,
          zone: documents.zone,
          uploadedAt: documents.uploadedAt,
          year: documents.year,
          type: documents.type,
          filetype: documents.filetype,
          uploadedBy: {
            email: users.email,
          },
        })
        .from(documents)
        .leftJoin(users, eq(documents.uploadedBy, users.id))
        .where(inArray(documents.branch, accessibleBranches))
        .orderBy(desc(documents.uploadedAt))
    }

    return NextResponse.json(userDocuments)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}