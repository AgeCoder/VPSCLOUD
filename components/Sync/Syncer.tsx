// app/components/Syncer.tsx
import { auth } from '@/lib/auth/auth'
import { dblocal } from '@/lib/localdb'
import { syncMetadata } from '@/lib/localdb/schema'
import { eq } from 'drizzle-orm'
import { SyncButton } from './SyncButton'
import { SyncService } from '@/lib/doc/syncDocuments'
import { User } from '@/types/types'

const SYNC_COOLDOWN_MIN = 3
const AUTO_SYNC_INTERVAL_MIN = 1440 // 24 hours

export default async function Syncer() {
    const session = await auth()
    if (!session?.user) return null

    const now = new Date()
    const lastSync = await getLastSync()
    const diffInMinutes = calculateTimeDifferenceInMinutes(now, lastSync?.lastSync)

    const canForceSync = diffInMinutes >= SYNC_COOLDOWN_MIN
    const shouldAutoSync = diffInMinutes >= AUTO_SYNC_INTERVAL_MIN

    if (shouldAutoSync) {
        await attemptAutoSync(session.user)
    }

    const cooldownRemainingMs = canForceSync ? 0 : (SYNC_COOLDOWN_MIN - diffInMinutes) * 60 * 1000

    return <SyncButton canSync={canForceSync} timeLeftMs={cooldownRemainingMs} />
}

// --- Helper Functions ---

async function getLastSync() {
    return await dblocal
        .select()
        .from(syncMetadata)
        .where(eq(syncMetadata.tableName, 'lastAllSync'))
        .then(res => res[0])
}

function calculateTimeDifferenceInMinutes(now: Date, lastSyncTime?: string): number {
    if (!lastSyncTime) return SYNC_COOLDOWN_MIN + 1

    const lastSyncDate = new Date(lastSyncTime)
    const diffMs = now.getTime() - lastSyncDate.getTime()
    return Math.floor(diffMs / (1000 * 60))
}

async function attemptAutoSync(user: User) {
    try {
        const syncService = new SyncService(user)
        const baseTables = ['users', 'branch', 'documents', 'settings', 'doctype']
        const tablesToSync = user.role === 'admin' ? [...baseTables, 'accessLogs'] : baseTables

        await syncService.syncAll({ fullSync: false, tables: tablesToSync })

        await dblocal
            .insert(syncMetadata)
            .values({ tableName: 'lastAllSync', lastSync: new Date().toISOString() })
            .onConflictDoUpdate({
                target: syncMetadata.tableName,
                set: { lastSync: new Date().toISOString() }
            })
    } catch (error) {
        console.error('Auto-sync failed:', error)
    }
}
