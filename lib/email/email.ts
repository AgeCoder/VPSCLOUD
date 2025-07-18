import { eq, inArray } from 'drizzle-orm'
import nodemailer from "nodemailer"
import { dblocal } from '../localdb'
import { settings } from '../localdb/schema'

/**
 * Fetch Gmail credentials from the database.
 */
async function getGmailCredentials() {
  const result = await dblocal
    .select()
    .from(settings)
    .where(inArray(settings.key, ["GMAIL_USER", "GMAIL_APP_PASSWORD"]))

  const settingMap = Object.fromEntries(result.map(r => [r.key, r.value]))

  const GMAIL_USER = settingMap["GMAIL_USER"]
  const GMAIL_APP_PASSWORD = settingMap["GMAIL_APP_PASSWORD"]

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error("Missing Gmail credentials in settings table")
  }

  return { GMAIL_USER, GMAIL_APP_PASSWORD }
}

/**
 * Create a nodemailer transporter using Gmail credentials.
 */
function createTransporter(user: string, pass: string) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  })
}

/**
 * Send an OTP email to the provided address.
 */
export async function sendOTPEmail(email: string, otp: string) {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = await getGmailCredentials()

  const transporter = createTransporter(GMAIL_USER, GMAIL_APP_PASSWORD)

  const mailOptions = {
    from: GMAIL_USER,
    to: email,
    subject: "Your Login OTP - VPS Cloud",
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0;">VPS Cloud</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Secure Cloud Hosting Solutions</p>
        </div>

        <div style="background-color: #f9fafb; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
          <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-bottom: 16px;">Your Login Verification Code</h2>
          <p style="color: #6b7280; font-size: 15px; line-height: 1.5; margin-bottom: 24px;">
            To complete your login, please use the following one-time verification code:
          </p>

          <div style="background: linear-gradient(135deg, #f3f4f6, #ffffff); border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #e5e7eb; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 700; color: #111827; letter-spacing: 8px; font-family: 'Courier New', monospace; display: inline-block; padding: 0 10px;">
              ${otp}
            </span>
          </div>

          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
            <p style="color: #b91c1c; font-size: 14px; margin: 0;">
              ⚠️ This code will expire in 10 minutes. Do not share it with anyone.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
            If you didn't request this code, please secure your account immediately by changing your password.
          </p>
        </div>

        <div style="text-align: center; margin-top: 40px;">
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
            This is an automated message. Please do not reply.<br>
            © ${new Date().getFullYear()} VPS Cloud. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error: any) {
    console.error("Email sending failed:", error)
    return { success: false, error: error.message || "Unknown error" }
  }
}

/**
 * Verifies if the Gmail transporter is working properly.
 */
export async function verifyEmailConfiguration() {
  try {
    const { GMAIL_USER, GMAIL_APP_PASSWORD } = await getGmailCredentials()
    const transporter = createTransporter(GMAIL_USER, GMAIL_APP_PASSWORD)
    await transporter.verify()
    return true
  } catch (error) {
    console.error("Email configuration error:", error)
    return false
  }
}
