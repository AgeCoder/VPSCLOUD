import { type NextRequest, NextResponse } from "next/server"
import { signOut } from "@/lib/auth/auth"

export async function GET(request: NextRequest) {
  try {

    try {
      await signOut()
    } catch (error) {
    }

    return NextResponse.json({
      message: "Logout successful",
      status: 200
    })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
