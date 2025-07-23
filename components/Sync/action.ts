// app/actions/sync.ts
'use server'

import { auth } from '@/lib/auth/auth'
import { SyncService } from '@/lib/doc/syncDocuments'
import { dblocal } from '@/lib/localdb'
import { syncMetadata } from '@/lib/localdb/schema'
import { eq } from 'drizzle-orm'

const SYNC_COOLDOWN_MIN = 3
const MAX_SYNC_DURATION_MS = 30_000 // 30 seconds
const SYNC_KEY = 'lastAllSync'

export async function forceSync(): Promise<void> {
    const syncId = Math.random().toString(36).substring(2, 8)
    const startTime = Date.now()

    try {
        console.log(`[Sync ${syncId}] Starting manual sync...`)

        const session = await auth()
        if (!session?.user) {
            console.warn(`[Sync ${syncId}] No session found`)
            throw new Error('Authentication required')
        }

        const now = new Date()

        // 🔁 This will throw a detailed cooldown error if needed
        await checkCooldownOrThrow(syncId, now)

        const syncService = new SyncService(session.user)
        const syncOptions = getSyncOptions(session.user.role)

        await Promise.race([
            syncService.syncAll(syncOptions),
            timeoutAfter(MAX_SYNC_DURATION_MS)
        ])

        await updateSyncTimestamp(now)

        const duration = (Date.now() - startTime) / 1000
        console.log(`[Sync ${syncId}] Sync completed in ${duration.toFixed(2)}s`)
    } catch (error) {
        const duration = (Date.now() - startTime) / 1000
        console.error(`[Sync ${syncId}] Sync failed after ${duration.toFixed(2)}s:`, error)
        throw error
    }
}

// --- Helper Functions ---

async function checkCooldownOrThrow(syncId: string, now: Date) {
    const lastSync = await dblocal
        .select()
        .from(syncMetadata)
        .where(eq(syncMetadata.tableName, SYNC_KEY))
        .then(res => res[0])

    if (!lastSync) return

    const lastTime = new Date(lastSync.lastSync)
    const diffMinutes = Math.floor((now.getTime() - lastTime.getTime()) / (1000 * 60))

    if (diffMinutes < SYNC_COOLDOWN_MIN) {
        const remaining = SYNC_COOLDOWN_MIN - diffMinutes
        console.warn(`[Sync ${syncId}] Cooldown active. Last sync was at ${lastTime.toISOString()}`)

        // 🚨 Throw custom error object
        const cooldownError = new Error(`Please wait ${remaining} more minute(s) before syncing again.`)
            ; (cooldownError as any).lastSync = lastTime.toISOString()
            ; (cooldownError as any).waitMinutes = remaining
        throw cooldownError
    }
}

function getSyncOptions(role: string) {
    const baseTables = ['users', 'branch', 'documents', 'settings', 'doctype']
    return {
        fullSync: false,
        tables: role === 'admin' ? [...baseTables, 'accessLogs'] : baseTables
    }
}

async function updateSyncTimestamp(date: Date) {
    const isoTime = date.toISOString()
    await dblocal.insert(syncMetadata).values({
        tableName: SYNC_KEY,
        lastSync: isoTime
    }).onConflictDoUpdate({
        target: syncMetadata.tableName,
        set: { lastSync: isoTime }
    })
}

function timeoutAfter(ms: number): Promise<never> {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sync timed out')), ms)
    })
}
