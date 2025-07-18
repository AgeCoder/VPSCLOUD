import fs from 'fs/promises';
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { documents, accessLogs, changeLog } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { deleteFromR2 } from "@/lib/cloudflare/r2"

import path from "path"
import { existsSync } from "fs"
import { dblocal } from '@/lib/localdb';
import { documents as localdocuments } from '@/lib/localdb/schema';
import { canAccessDocument } from '@/lib/auth/access-control';

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
        const [document] = await db.select().from(documents).where(eq(documents.id, Number(id)))
        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 })
        }

        // Step 3: Permission check
        if (! await canAccessDocument(
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
            tableName: 'documents',
            recordId: document.id,
            changeType: 'delete',
            changedAt: new Date().toISOString(),
            changedBy: Number(session.user.id),
        });

        // Step 5: Log access
        await db.insert(accessLogs).values({
            userId: session.user.id,
            fileId: document.id,
            action: "delete",
            timestamp: new Date().toISOString()
        })

        // Step 6: Delete from R2
        await deleteFromR2(document.r2Key)

        const fileExtension = path.extname(document.originalFilename)
        const localPath = path.join(process.cwd(), "public", "decrypted-files", `${document.filename}${fileExtension}`)

        if (existsSync(localPath)) {
            await fs.unlink(localPath)
            console.log("Deleted local decrypted file:", localPath)
        }

        // Step 7: Delete from DB
        await db.delete(documents).where(eq(documents.id, Number(id)))

        if (session.user.role == 'admin' || session.user.branch == document.branch || document.zone == session.user.zone) {
            const exists = await dblocal.select().from(localdocuments).where(eq(localdocuments.id, Number(id)))
            if (exists.length > 0) {
                await dblocal.delete(localdocuments).where(eq(localdocuments.id, Number(id)))
            }
        }

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