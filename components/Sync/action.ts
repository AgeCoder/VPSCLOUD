// app/actions/sync.ts
'use server'

import { auth } from '@/lib/auth/auth'
import { SyncService } from '@/lib/doc/syncDocuments'
import { dblocal } from '@/lib/localdb'
import { syncMetadata } from '@/lib/localdb/schema'
import { eq } from 'drizzle-orm'

const SYNC_COOLDOWN_MIN = 3
const MAX_SYNC_DURATION_MS = 30000

export async function forceSync(): Promise<void> {
    const startTime = Date.now()
    const syncId = Math.random().toString(36).substring(2, 8)

    try {
        console.log(`[Sync ${syncId}] Starting manual sync...`)

        const session = await auth()
        if (!session?.user) {
            console.warn(`[Sync ${syncId}] No session found`)
            throw new Error('Authentication required')
        }

        // Check last sync time
        const lastSync = await dblocal
            .select()
            .from(syncMetadata)
            .where(eq(syncMetadata.tableName, 'lastAllSync'))
            .then((res) => res[0])

        if (lastSync) {
            const lastSyncDate = new Date(lastSync.lastSync)
            const diff = Date.now() - lastSyncDate.getTime()
            const diffMinutes = Math.floor(diff / 1000 / 60)

            if (diffMinutes < SYNC_COOLDOWN_MIN) {
                const remaining = SYNC_COOLDOWN_MIN - diffMinutes
                console.warn(`[Sync ${syncId}] Sync too soon. Wait ${remaining} more minutes`)
                throw new Error(`Please wait ${remaining} more minutes before syncing again`)
            }
        }

        // Perform sync with timeout
        const syncService = new SyncService(session.user);

        const isAdmin = session.user.role === 'admin';

        const syncPromise = syncService.syncAll(
            isAdmin
                ? { fullSync: false, tables: ['users', 'branch', 'documents', 'settings', 'accessLogs'] }
                : { fullSync: false, tables: ['users', 'branch', 'documents', 'settings'] }
        )
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Sync timed out')), MAX_SYNC_DURATION_MS)
        )

        await Promise.race([syncPromise, timeoutPromise])

        // Update sync metadata
        await dblocal.insert(syncMetadata).values({
            tableName: 'lastAllSync',
            lastSync: new Date().toISOString()
        }).onConflictDoUpdate({
            target: syncMetadata.tableName,
            set: { lastSync: new Date().toISOString() }
        })

        const duration = (Date.now() - startTime) / 1000
        console.log(`[Sync ${syncId}] Sync completed in ${duration.toFixed(2)}s`)
    } catch (error) {
        const duration = (Date.now() - startTime) / 1000
        console.error(`[Sync ${syncId}] Sync failed after ${duration.toFixed(2)}s:`, error)
        throw error
    }
}