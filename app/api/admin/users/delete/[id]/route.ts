import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, documents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

// Define your permanent admin user ID (set this based on your DB seed)

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id: userId } = await params

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        if (userId === session.user.id) {
            return NextResponse.json({ error: 'Cannot delete permanent admin user' }, { status: 403 })
        }

        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))

        if (existingUser.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Reassign documents uploaded by this user to permanent admin
        await db
            .update(documents)
            .set({ uploadedBy: session.user.id })
            .where(eq(documents.uploadedBy, userId))

        // Now delete the user
        await db
            .delete(users)
            .where(eq(users.id, userId))

        return NextResponse.json({ message: 'User deleted and documents reassigned' }, { status: 200 })
    } catch (error) {
        console.error('Delete user error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
