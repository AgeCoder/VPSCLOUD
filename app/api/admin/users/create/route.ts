import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth/auth'
import { dblocal } from '@/lib/localdb'
import { users as loacaluser } from '@/lib/localdb/schema'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await req.json()
        const { email, role = "branch", zone = "", branch = "", canUpload = false } = body

        if (!email?.trim()) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, email))

        if (existing.length > 0) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 })
        }


        const result = await db
            .insert(users)
            .values({ email, role, zone, branch, canUpload })
            .returning()


        if (!result || result.length === 0) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        if (session.user.role == 'admin') {
            await dblocal
                .insert(loacaluser)
                .values({
                    id: result[0].id,
                    email,
                    role,
                    zone,
                    branch,
                    canUpload,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
                .returning()
        }

        return NextResponse.json({ user: result[0] }, { status: 201 })
    } catch (error) {
        console.error("Create user error:", error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
