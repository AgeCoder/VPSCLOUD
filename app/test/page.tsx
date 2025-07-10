import { auth } from '@/lib/auth'
import { syncDocuments } from '@/lib/syncDocuments'

export default async function TestPage() {
    const session = await auth()
    if (!session) return null

    const result = await syncDocuments(session.user)
    console.log(result)

    return (
        <div>
            <h1>Test Page</h1>
        </div>
    )
}
