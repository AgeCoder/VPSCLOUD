import { auth } from '@/lib/auth'
import { dblocal } from '@/lib/localdb'
import { syncMetadata } from '@/lib/localdb/schema'
import { SyncService } from '@/lib/syncDocuments'
import { eq } from 'drizzle-orm'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export default async function Syncer() {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    // Create user object for sync service from session
    const user = {
        id: session.user.id,
        email: session.user.email || '',
        role: session.user.role || 'branch',
        branch: session.user.branch || null,
        zone: session.user.zone || null
    }

    const handleForceSync = async () => {
        'use server'
        const syncService = new SyncService(user)
        try {
            await syncService.syncAll({ fullSync: true })
        } catch (error) {
            console.error('Manual sync failed:', error)
        }
    }

    const lastsync = await dblocal.select().from(syncMetadata).where(
        eq(syncMetadata.tableName, 'lastAllSync')
    ).then((res) => res[0])

    if (lastsync) {
        const lastSyncDate = new Date(lastsync.lastSync)
        const now = new Date()
        const diff = now.getTime() - lastSyncDate.getTime()
        const diffInMinutes = Math.floor(diff / 1000 / 60)
        if (diffInMinutes < 10) { // Changed from 5 to 10 minutes
            console.log('Synced less than 10 minutes ago, skipping sync')
            return (
                <div className="fixed bottom-4 right-2.5">
                    <form action={handleForceSync}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            )
        }
    }

    // Create sync service instance
    const syncService = new SyncService(user)

    try {
        // Perform initial sync (full sync on first load)
        await syncService.syncAll({ fullSync: true })
        console.log('synced');

        await dblocal.insert(syncMetadata).values({
            tableName: 'lastAllSync',
            lastSync: new Date().toISOString()
        }).onConflictDoUpdate({
            target: syncMetadata.tableName,
            set: {
                lastSync: new Date().toISOString()
            }
        })
        return (
            <div className="fixed bottom-4 right-4">
                <form action={handleForceSync}>
                    <Button variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        )
    } catch (error) {
        console.error('Sync failed:', error)
        return (
            <div className="fixed bottom-4 right-4">
                <form action={handleForceSync}>
                    <Button variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        )
    }
}