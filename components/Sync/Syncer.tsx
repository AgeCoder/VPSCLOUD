// app/components/Syncer.tsx
import { auth } from '@/lib/auth/auth'
import { dblocal } from '@/lib/localdb'
import { syncMetadata } from '@/lib/localdb/schema'
import { eq } from 'drizzle-orm'
import { SyncButton } from './SyncButton'
import { SyncService } from '@/lib/doc/syncDocuments'

const SYNC_COOLDOWN_MIN = 3
const AUTO_SYNC_INTERVAL_MIN = 1440

export default async function Syncer() {
    const session = await auth()
    if (!session?.user) return null

    // Get last sync time
    const lastSync = await dblocal
        .select()
        .from(syncMetadata)
        .where(eq(syncMetadata.tableName, 'lastAllSync'))
        .then((res) => res[0])

    const now = new Date()
    let diffInMinutes = SYNC_COOLDOWN_MIN + 1

    if (lastSync) {
        const diff = now.getTime() - new Date(lastSync.lastSync).getTime()
        diffInMinutes = Math.floor(diff / 1000 / 60)
    }

    const canForceSync = diffInMinutes >= SYNC_COOLDOWN_MIN

    // Auto-sync logic
    if (diffInMinutes >= AUTO_SYNC_INTERVAL_MIN) {
        try {
            const syncService = new SyncService(session.user)
            if (session.user.role !== 'admin') {
                await syncService.syncAll({
                    fullSync: false,
                    tables: ['users', 'branch', 'documents', 'settings']
                })
            } else {
                await syncService.syncAll({ fullSync: false, tables: ['users', 'branch', 'documents', 'settings', 'accessLogs'] })
            }

            await dblocal.insert(syncMetadata).values({
                tableName: 'lastAllSync',
                lastSync: new Date().toISOString()
            }).onConflictDoUpdate({
                target: syncMetadata.tableName,
                set: { lastSync: new Date().toISOString() }
            })
        } catch (err) {
            console.error('Auto-sync failed:', err)
        }
    }

    // app/components/Syncer.tsx
    return <SyncButton canSync={canForceSync} timeLeftMs={diffInMinutes < SYNC_COOLDOWN_MIN ? SYNC_COOLDOWN_MIN * 60 * 1000 - (diffInMinutes * 60 * 1000) : 0} />
}