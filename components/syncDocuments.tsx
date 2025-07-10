import { auth } from "@/lib/auth"
import { syncDocuments } from "@/lib/syncDocuments";

export default async function SyncDocuments() {
    const session = await auth()
    if (!session) return null

    const user = session.user

    if (!user) {
        return null
    }

    syncDocuments(user).then((result) => console.log(result));

    return (
        <>
        </>
    )
}
