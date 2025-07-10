import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, documents, accessLogs } from "@/lib/db/schema"
import { count, eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [userCount] = await db.select({ count: count() }).from(users)
    const [documentCount] = await db.select({ count: count() }).from(documents)
    const [downloadCount] = await db
      .select({ count: count() })
      .from(accessLogs)
      .where(eq(accessLogs.action, "download"))

    return NextResponse.json({
      totalUsers: userCount.count,
      totalDocuments: documentCount.count,
      totalDownloads: downloadCount.count,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
