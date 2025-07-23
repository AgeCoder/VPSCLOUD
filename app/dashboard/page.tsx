// app/dashboard/page.tsx
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { dblocal } from "@/lib/localdb/index"
import { branch, doctype, settings } from "@/lib/localdb/schema"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import Navbar from "@/components/layout/Navbar"
import RunCleanup from "@/lib/Cleanup/RunCleanup"


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
    docType: doctype.type
  }).from(doctype)
    .then(res => res.map(item => item.docType));


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

      {
        session.user.role === 'admin' ? (
          <RunCleanup />
        ) : null
      }
      <Navbar user={session.user} />
      <DashboardContent
        user={session.user}
        zoneMapping={ZONE_MAPPING}
        canUpload={canUpload}
        docType={docType}
      />
    </>
  )
}