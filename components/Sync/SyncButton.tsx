'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { forceSync } from './action'
import { toast } from 'sonner'

interface SyncButtonProps {
    canSync: boolean
    timeLeftMs: number
}

export function SyncButton({ canSync, timeLeftMs }: SyncButtonProps) {
    const [isPending, startTransition] = useTransition()
    const [timeLeft, setTimeLeft] = useState(timeLeftMs)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (!canSync && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1000) {
                        clearInterval(intervalRef.current!)
                        return 0
                    }
                    return prev - 1000
                })
            }, 1000)
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [canSync, timeLeft])

    const handleSync = () => {
        startTransition(async () => {
            try {
                await forceSync()
                toast.success('Sync successful', {
                    description: 'Data has been synchronized successfully.',
                })
                window.location.reload()
            } catch (error: any) {
                const message = error.message || 'Sync failed'
                const lastSync = error.lastSync
                const wait = error.waitMinutes
                toast.error('Sync failed', {
                    description: wait
                        ? `Last sync: ${formatDate(lastSync)}. Please wait ${wait} more minute(s).`
                        : message
                })
            }
        })
    }

    return canSync ? (
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
    ) : (
        <Button
            disabled
            variant="destructive"
            title="Please wait before syncing again"
            className="opacity-60 cursor-not-allowed gap-2"
        >
            <RefreshCw className="h-4 w-4" />
            Wait {formatTime(timeLeft)}
        </Button>
    )
}

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}m ${seconds}s`
}

function formatDate(iso: string) {
    const date = new Date(iso)
    return date.toLocaleTimeString()
}
