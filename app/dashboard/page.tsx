
import { DashboardContent } from "@/components/dashboard-content"
import SyncDocuments from "@/components/syncDocuments"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"


export default async function DashboardPage() {
  const session = await auth()

  if (!session.user) {
    redirect('/login')
  }

  return <>

    <DashboardContent user={session.user} />
  </>
}
