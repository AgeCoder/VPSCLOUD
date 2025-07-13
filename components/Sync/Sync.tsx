// Add this to your page component if you want to allow manual sync
'use client'
import { useState } from 'react'

// ... inside your component
const [isSyncing, setIsSyncing] = useState(false)
const [syncResult, setSyncResult] = useState<any>(null)

const handleSync = async () => {
    setIsSyncing(true)
    try {
        const result = await syncService.syncAll()
        setSyncResult(result)
    } catch (error) {
        console.error(error)
    } finally {
        setIsSyncing(false)
    }
}

// Add a sync button to your JSX
<button
    onClick={handleSync}
    disabled={isSyncing}
    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
>
    {isSyncing ? 'Syncing...' : 'Sync Now'}
</button>