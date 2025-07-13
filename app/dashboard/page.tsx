// app/dashboard/page.tsx
import { DashboardContent } from "@/components/dashboard-content"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { dblocal } from "@/lib/localdb/index"
import { branch, settings } from "@/lib/localdb/schema"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import Syncer from "@/components/Sync/Syncer"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // Fetch all branches from the database
  const branches = await dblocal.select().from(branch)
  const canUpload = await db.select({
    canUpload: users.canUpload
  }).from(users).where(eq(users.id, session.user.id)).then((res) => res[0]?.canUpload)
  const docType = await dblocal.select({
    docType: settings.key
  }).from(settings).where(eq(settings.value, 'DOC_TYPE_')).then(
    (res) => res.map((item) => item.docType)
  )

  // Transform branches into ZONE_MAPPING format
  const ZONE_MAPPING = branches.reduce((acc, branch) => {
    if (!acc[branch.zone]) {
      acc[branch.zone] = []
    }
    acc[branch.zone].push(branch.name)
    return acc
  }, {} as Record<string, string[]>)

  return (
    <>
      {/* <Syncer /> */}
      <DashboardContent
        user={session.user}
        zoneMapping={ZONE_MAPPING}
        canUpload={canUpload}
        docType={docType}
      />
    </>
  )
}