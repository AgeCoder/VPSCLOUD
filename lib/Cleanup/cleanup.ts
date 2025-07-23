"use server";

import { db } from "@/lib/db"; // Main production DB (e.g., Neon)
import { dblocal } from "../localdb"; // Local DB
import { eq, sql } from "drizzle-orm";
import { parseISO, format } from "date-fns";
import fs from "fs";
import path from "path";
import { accessLogs, syncMetadata } from "../localdb/schema";
import { accessLogs as serverAccessLog } from "../db/schema";
import { loginSessions } from "../db/schema";

export async function performCleanupIfDue() {
    try {
        const today = new Date();
        const todayDay = today.getDate();

        // Check last cleanup record
        const [cleanupRecord] = await dblocal
            .select()
            .from(syncMetadata)
            .where(eq(syncMetadata.tableName, "cleanup"));

        const lastCleanup = cleanupRecord?.lastSync
            ? parseISO(cleanupRecord.lastSync)
            : null;

        const eleventhThisMonth = new Date(today.getFullYear(), today.getMonth(), 29);
        const isToday11th = todayDay === 29;
        const isPast11th = today > eleventhThisMonth;
        const missed11th =
            lastCleanup && lastCleanup < eleventhThisMonth && isPast11th;

        if (isToday11th || missed11th) {
            const cutoffDate = new Date();
            cutoffDate.setDate(today.getDate() - 30);
            const cutoffISO = cutoffDate.toISOString();

            // Export old access logs from local
            const oldLogs = await dblocal
                .select()
                .from(accessLogs)
                .where(sql`datetime(created_at) < datetime('${cutoffISO}')`);

            const headers = Object.keys(oldLogs[0] ?? {}).join(",");
            const csvContent = oldLogs.length > 0
                ? [headers, ...oldLogs.map(log => Object.values(log).join(","))].join("\n")
                : "";

            const backupDir = path.join(process.cwd(), "backups");
            if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

            const filePath = path.join(
                backupDir,
                `accessLogs-${format(today, "yyyy-MM-dd")}.csv`
            );
            fs.writeFileSync(filePath, csvContent);

            // Delete old logs and sessions
            await Promise.all([
                dblocal
                    .delete(accessLogs)
                    .where(sql`datetime(created_at) < datetime('${cutoffISO}')`),

                db
                    .delete(serverAccessLog)
                    .where(sql`datetime(created_at) < datetime('${cutoffISO}')`),

                db
                    .delete(loginSessions)
                    .where(sql`datetime(login_at) < datetime('${cutoffISO}')`),
            ]);

            // Update or insert cleanup record
            if (cleanupRecord) {
                await dblocal
                    .update(syncMetadata)
                    .set({ lastSync: format(today, "yyyy-MM-dd") })
                    .where(eq(syncMetadata.tableName, "cleanup"));
            } else {
                await dblocal.insert(syncMetadata).values({
                    tableName: "cleanup",
                    lastSync: format(today, "yyyy-MM-dd"),
                });
            }

            return {
                success: true,
                cleanedUp: true,
                filePath,
            };
        }

        return {
            success: true,
            cleanedUp: false,
            reason: "Not due yet",
        };
    } catch (error) {
        // On error: mark sync as "error" to block future attempts until manually reset
        await dblocal
            .insert(syncMetadata)
            .values({ tableName: "cleanup", lastSync: "error" })
            .onConflictDoUpdate({
                target: syncMetadata.tableName,
                set: { lastSync: "error" },
            });

        // Silent fail
        return {
            success: false,
            cleanedUp: false,
            error: "Cleanup failed silently",
        };
    }
}
