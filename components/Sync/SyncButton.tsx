'use client'

import { useEffect, useState, useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { forceSync } from './action'
import { toast } from 'sonner'

export function SyncButton({ canSync, timeLeftMs }: { canSync: boolean; timeLeftMs: number }) {
    const [isPending, startTransition] = useTransition()
    const [timeLeft, setTimeLeft] = useState(timeLeftMs)

    useEffect(() => {
        if (!canSync && timeLeft > 0) {
            const interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1000) {
                        clearInterval(interval)
                        return 0
                    }
                    return prev - 1000
                })
            }, 1000)

            return () => clearInterval(interval)
        }
    }, [canSync, timeLeft])

    const handleSync = () => {
        startTransition(async () => {
            try {
                await forceSync()
                toast('Sync successful', {
                    description: 'Data has been synchronized',
                })
                window.location.reload()
            } catch (error) {
                toast('Sync failed', {
                    description: error instanceof Error ? error.message : 'Failed to sync data',
                })
            }
        })
    }

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000)
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60
        return `${minutes}m ${seconds}s`
    }

    return (
        <>
            {!canSync ? (
                <Button
                    variant="destructive"
                    disabled
                    title="Please wait before syncing again"
                    className="opacity-60 cursor-not-allowed"
                >
                    <RefreshCw className="h-4 w-4" />
                    Wait {formatTime(timeLeft)}
                </Button>
            ) : (
                <Button
                    onClick={handleSync}
                    disabled={isPending}
                    variant="secondary"
                    size="icon"
                    title="Sync now"
                    className="gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                </Button>
            )}
        </>
    )
}
