import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { users } from "@/lib/localdb/schema"
import { dblocal } from "@/lib/localdb"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const allUsers = await dblocal.select().from(users).orderBy(users.createdAt)
    return NextResponse.json(allUsers)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
