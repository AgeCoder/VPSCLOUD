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

                <div style="background: linear-gradient(135deg, #f3f4f6, #ffffff); 
                border-radius: 8px; 
                padding: 20px; 
                text-align: center; 
                border: 1px solid #e5e7eb;
                margin-bottom: 24px;">
                    <span style="font-size: 32px; 
                  font-weight: 700; 
                  color: #111827; 
                  letter-spacing: 8px;
                  font-family: 'Courier New', monospace;
                  display: inline-block;
                  padding: 0 10px;">
                        ${otp}
                    </span>
                </div>

                <div style="background-color: #fef2f2; 
                border-left: 4px solid #ef4444;
                padding: 12px 16px;
                border-radius: 4px;
                margin-bottom: 24px;">
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
