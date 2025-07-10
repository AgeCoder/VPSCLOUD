import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { documents, accessLogs, changeLog } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { deleteFromR2 } from "@/lib/r2"
import { canAccessDocument } from "@/lib/access-control"

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = await params

    try {
        // Step 1: Auth check
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Step 2: Fetch document from DB
        const [document] = await db.select().from(documents).where(eq(documents.id, id))
        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 })
        }

        // Step 3: Permission check
        if (!canAccessDocument(
            session.user.role,
            session.user.zone,
            session.user.branch,
            document.branch,
            document.zone
        )) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }

        // Step 4: Create change log entry FIRST
        await db.insert(changeLog).values({
            documentId: document.id,
            changeType: "delete",
            changedAt: new Date()
        })

        // Step 5: Log access
        await db.insert(accessLogs).values({
            id: crypto.randomUUID(),
            userId: session.user.id,
            fileId: document.id,
            action: "delete",
            timestamp: new Date()
        })

        // Step 6: Delete from R2
        await deleteFromR2(document.r2Key)

        // Step 7: Delete from DB
        await db.delete(documents).where(eq(documents.id, id))

        return NextResponse.json({
            message: "File deleted successfully",
            deletedId: id
        }, { status: 200 })
    } catch (err: unknown) {
        console.error("DELETE failed:", err)
        const error = err instanceof Error ? err.message : "Internal server error"
        return NextResponse.json({ error }, { status: 500 })
    }
}