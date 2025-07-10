import NextAuth from "next-auth"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { generateOTP, isValidEmail } from "@/lib/utils"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        try {
          const email = typeof credentials?.email === "string" ? credentials.email : ""
          const otp = typeof credentials?.otp === "string" ? credentials.otp : ""

          if (!email || !isValidEmail(email)) {
            return null
          }

          if (!otp || otp.length !== 6) {
            return null
          }

          // Verify OTP
          const isValidOTP = await verifyOTP(email, otp)
          if (!isValidOTP) {
            return null
          }

          // Get user
          const user = await getUserByEmail(email)
          if (!user) {
            return null
          }


          return {
            id: user.id,
            email: user.email,
            role: user.role,
            zone: user.zone,
            branch: user.branch,

          }
        } catch {
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.zone = user.zone
        token.branch = user.branch

      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.zone = token.zone as string
        session.user.branch = token.branch as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
})

// Custom authentication functions
export async function createUser(email: string) {
  const [user] = await db
    .insert(users)
    .values({
      email,
      role: "branch", // Default role
    })
    .returning()

  return user
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return user
}

export async function createVerificationToken(email: string) {
  const token = generateOTP()
  const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Delete any existing tokens for this email
  await db.delete(verificationTokens).where(eq(verificationTokens.email, email))

  const [verificationToken] = await db
    .insert(verificationTokens)
    .values({
      email,
      token,
      expires,
    })
    .returning()

  return verificationToken
}

export async function verifyOTP(email: string, token: string) {
  const [verificationToken] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.email, email),
        eq(verificationTokens.token, token),
        gt(verificationTokens.expires, new Date()),
      ),
    )
    .limit(1)

  if (verificationToken) {
    // Delete the used token
    await db.delete(verificationTokens).where(eq(verificationTokens.id, verificationToken.id))
    return true
  }

  return false
}
