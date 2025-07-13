// import { auth } from '@/lib/auth'
// import { SyncService } from '@/lib/syncDocuments'

// import React from 'react'

// export default async function SyncPage() {
//     const session = await auth()

//     if (!session?.user) {
//         return <div>Not authenticated</div>
//     }

//     // Create user object for sync service from session
//     const user = {
//         id: session.user.id,
//         email: session.user.email || '',
//         role: session.user.role || 'branch', // Default to 'branch' if not provided
//         branch: session.user.branch || null,
//         zone: session.user.zone || null
//     }

//     // Create sync service instance
//     const syncService = new SyncService(user)

//     try {
//         // Perform initial sync (full sync on first load)
//         const syncResult = await syncService.syncAll({ fullSync: true })
//         console.log('Sync result:', syncResult)

//         return (
//             <div className="p-4">
//                 <h1 className="text-2xl font-bold mb-4">Database Synchronization</h1>

//                 <div className=" p-4 rounded shadow">
//                     <h2 className="text-xl font-semibold mb-2">Sync Status</h2>
//                     <pre className=" p-2 rounded text-sm overflow-auto">
//                         {JSON.stringify(syncResult, null, 2)}
//                     </pre>
//                 </div>

//                 <div className="mt-4  p-4 rounded shadow">
//                     <h2 className="text-xl font-semibold mb-2">User Info</h2>
//                     <pre className=" p-2 rounded text-sm overflow-auto">
//                         {JSON.stringify(session.user, null, 2)}
//                     </pre>
//                 </div>
//             </div>
//         )
//     } catch (error) {
//         console.error('Sync failed:', error)
//         return (
//             <div className="p-4">
//                 <h1 className="text-2xl font-bold mb-4">Database Synchronization</h1>
//                 <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//                     <strong>Error:</strong> Synchronization failed. Please try again later.
//                 </div>
//                 {error instanceof Error && (
//                     <div className="mt-2 text-sm text-red-600">
//                         {error.message}
//                     </div>
//                 )}
//             </div>
//         )
//     }
// }/

import React from 'react'

export default async function page() {



    return (
        <div>

        </div>
    )
}
