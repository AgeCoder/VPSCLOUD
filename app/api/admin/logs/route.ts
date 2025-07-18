import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { accessLogs, users, documents } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const logs = await db
      .select({
        id: accessLogs.id,
        action: accessLogs.action,
        timestamp: accessLogs.timestamp,
        user: {
          email: users.email,
        },
        file: {
          originalFilename: documents.originalFilename,
        },
      })
      .from(accessLogs)
      .leftJoin(users, eq(accessLogs.userId, users.id))
      .leftJoin(documents, eq(accessLogs.fileId, documents.id))
      .orderBy(accessLogs.timestamp)
      .limit(100)

    return NextResponse.json(logs)
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
