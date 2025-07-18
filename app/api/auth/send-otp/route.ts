import { type NextRequest, NextResponse } from "next/server"
import { createVerificationToken, getUserByEmail } from "@/lib/auth/auth"
import { isValidEmail } from "@/lib/utils"
import { sendOTPEmail } from "@/lib/email/email"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Check if user exists, if not create one
    let user = await getUserByEmail(email)
    if (!user) {

      return NextResponse.json(
        { error: "User does not exist" },
        { status: 400 }
      )


    }

    // Create verification token (OTP)
    const verificationToken = await createVerificationToken(email)

    // Send OTP email
    const emailResult = await sendOTPEmail(email, verificationToken.token)

    if (!emailResult.success) {
      return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      // Don't send the actual token in response for security
    })
  } catch (error) {
    console.error("Send OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
