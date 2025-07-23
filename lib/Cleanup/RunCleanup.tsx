// app/components/RunCleanup.tsx
import { dblocal } from "@/lib/localdb";
import { syncMetadata } from "@/lib/localdb/schema";
import { eq } from "drizzle-orm";
import { parseISO, isValid } from "date-fns";
import { performCleanupIfDue } from "./cleanup";

export default async function RunCleanup() {
    try {
        // ✅ Fetch last cleanup record safely
        const [rec] = await dblocal
            .select()
            .from(syncMetadata)
            .where(eq(syncMetadata.tableName, "cleanup"));

        const lastCleanup = rec?.lastSync ? parseISO(rec.lastSync) : null;
        const today = new Date();
        const dayOfMonth = today.getDate();

        // ✅ Calculate days since last cleanup safely
        const daysSince =
            lastCleanup && isValid(lastCleanup)
                ? Math.floor((today.getTime() - lastCleanup.getTime()) / (1000 * 60 * 60 * 24))
                : Infinity;

        // ✅ Perform cleanup only if it's the 29th or 30 days passed
        if (dayOfMonth === 29 || daysSince >= 30) {
            await performCleanupIfDue();
        }
    } catch (error) {
        // ✅ Never throw: log only
        console.error("🛑 Cleanup check failed:", error);
    }

    // ✅ Server component returns nothing
    return null;
}
