import { signIn } from "@/lib/auth"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()
    await signIn("credentials", {
      email: email,
      otp: otp,
      redirect: false,
    })
    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
