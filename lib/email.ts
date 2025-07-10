import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
  },
})

export async function sendOTPEmail(email: string, otp: string) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Your Login OTP - Document Management System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Document Management System</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin-bottom: 15px;">Your Login Code</h3>
          <p style="color: #6c757d; margin-bottom: 20px;">
            Use the following code to sign in to your account:
          </p>
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; text-align: center; border: 2px dashed #dee2e6;">
            <span style="font-size: 24px; font-weight: bold; color: #495057; letter-spacing: 3px;">
              ${otp}
            </span>
          </div>
          <p style="color: #6c757d; margin-top: 20px; font-size: 14px;">
            This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #6c757d; font-size: 12px;">
            This is an automated message, please do not reply.
          </p>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error("Email sending failed:", error)
    return { success: false, error: error.message }
  }
}

export async function verifyEmailConfiguration() {
  try {
    await transporter.verify()
    return true
  } catch (error) {
    console.error("Email configuration error:", error)
    return false
  }
}
