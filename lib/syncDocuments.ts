import { eq, count, and, gt, inArray, notInArray } from "drizzle-orm";
import { db } from "./db";
import { changeLog, documents } from "./db/schema";
import { syncMetadata, documents as localDocuments } from "./localdb/schema";
import { dblocal } from "./localdb";

export async function syncDocuments(user: { id: string; branch: string; role: string }) {
    try {
        // 1. Get last sync time
        const lastSyncResult = await dblocal
            .select({ value: syncMetadata.value })
            .from(syncMetadata)
            .where(eq(syncMetadata.key, "lastSync"))
            .all();

        const lastSync = lastSyncResult[0]?.value || new Date(0).toISOString();

        // 2. Fetch all server documents
        const serverDocs = await db
            .select()
            .from(documents)
            .where(user.role !== "admin" ? eq(documents.branch, user.branch) : undefined);

        const serverCount = serverDocs.length;
        const serverDocIds = serverDocs.map(doc => String(doc.id));

        // 3. Fetch all local documents
        const localDocs = await dblocal
            .select()
            .from(localDocuments)
            .where(user.role !== "admin" ? eq(localDocuments.branch, user.branch) : undefined)
            .all();

        const localCount = localDocs.length;
        const localDocIds = localDocs.map(doc => doc.id);

        // 4. Identify documents to delete (exist locally but not on server)
        const docsToDelete = localDocIds.filter(id => !serverDocIds.includes(id));

        // 5. Identify documents to upsert
        const docsToUpsert = serverDocs.filter(doc =>
            !localDocIds.includes(String(doc.id)) ||
            localDocs.some(localDoc =>
                String(localDoc.id) === String(doc.id) &&
                new Date(localDoc.updatedAt) < new Date(doc.updatedAt)
            )
        );

        // 6. Process deletions
        if (docsToDelete.length > 0) {
            await dblocal
                .delete(localDocuments)
                .where(inArray(localDocuments.id, docsToDelete));
        }

        // 7. Process upserts
        for (const doc of docsToUpsert) {
            const docData = {
                id: String(doc.id),
                filename: doc.filename,
                originalFilename: doc.originalFilename,
                branch: doc.branch,
                zone: doc.zone,
                year: doc.year,
                filetype: doc.filetype,
                type: doc.type,
                uploadedBy: String(doc.uploadedBy),
                r2Key: doc.r2Key,
                iv: doc.iv,
                tag: doc.tag,
                uploadedAt: doc.uploadedAt.toISOString(),
                updatedAt: doc.updatedAt.toISOString(),
            };

            await dblocal
                .insert(localDocuments)
                .values(docData)
                .onConflictDoUpdate({
                    target: localDocuments.id,
                    set: docData,
                });
        }

        // 8. Update sync metadata
        await dblocal
            .insert(syncMetadata)
            .values({
                key: "lastSync",
                value: new Date().toISOString()
            })
            .onConflictDoUpdate({
                target: syncMetadata.key,
                set: {
                    value: new Date().toISOString()
                },
            });

        // 9. Get final count
        const finalCountResult = await dblocal
            .select({ count: count() })
            .from(localDocuments)
            .where(user.role !== "admin" ? eq(localDocuments.branch, user.branch) : undefined)
            .all();

        const finalLocalCount = Number(finalCountResult[0]?.count || 0);
        const totalChanges = docsToDelete.length + docsToUpsert.length;

        return {
            status: "synced",
            updated: totalChanges,
            serverCount,
            initialLocalCount: localCount,
            finalLocalCount,
            changesProcessed: totalChanges,
            docsDeleted: docsToDelete.length,
            docsUpserted: docsToUpsert.length
        };
    } catch (error: unknown) {
        console.error("Sync error:", error);
        return {
            status: "error",
            message: error instanceof Error ? error.message : "Sync failed",
            error: error instanceof Error ? error.stack : undefined
        };
    }
}