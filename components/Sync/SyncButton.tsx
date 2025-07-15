'use client'

import { useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { forceSync } from './action'
import { toast } from 'sonner'

export function SyncButton({ canSync }: { canSync: boolean }) {
    const [isPending, startTransition] = useTransition()


    const handleSync = () => {
        startTransition(async () => {
            try {
                await forceSync()
                toast('Sync successful', {
                    description: 'Data has been synchronized',
                })
            } catch (error) {
                toast('Sync failed', {
                    description: error instanceof Error ? error.message : 'Failed to sync data',
                })
            }
        })
    }


    return (
        <Button
            onClick={handleSync}
            disabled={!canSync || isPending}
            variant='secondary'
            size='icon'
            title={!canSync ? 'Please wait before syncing again' : 'Sync now'}
            className={`gap-2 ${!canSync ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
        </Button>
    )
}
