import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { dblocal } from "@/lib/localdb"
import { documents, users } from "@/lib/db/schema"
import { documents as localDocuments } from "@/lib/localdb/schema"
import { count, desc, eq, inArray } from "drizzle-orm"
import { getAccessibleBranches } from "@/lib/access-control"
import { auth } from "@/lib/auth"
import { syncDocuments } from "@/lib/syncDocuments"

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

    // First check if we need to sync
    const [serverCountResult, localCountResult] = await Promise.all([
      db.select({ count: count() })
        .from(documents)
        .where(inArray(documents.branch, accessibleBranches)),
      dblocal.select({ count: count() })
        .from(localDocuments)
        .where(inArray(localDocuments.branch, accessibleBranches))
        .all()
    ])

    const serverCount = Number(serverCountResult[0]?.count || 0)
    const localCount = Number(localCountResult[0]?.count || 0)

    // Trigger sync if counts don't match
    if (serverCount !== localCount) {
      console.log(`Count mismatch - Server: ${serverCount}, Local: ${localCount}. Triggering sync...`)
      await syncDocuments({
        id,
        role,
        branch
      })
    }

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
          uploadedAt: localDocuments.uploadedAt,
          uploadedBy: localDocuments.uploadedBy,
        })
        .from(localDocuments)
        .where(inArray(localDocuments.branch, accessibleBranches))
        .orderBy(desc(localDocuments.uploadedAt))
        .all()

      // If local DB is empty but server has data, fallback to server
      if (userDocuments.length === 0 && serverCount > 0) {
        throw new Error('Local DB empty but server has documents')
      }
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