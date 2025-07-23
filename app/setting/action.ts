// app/actions/settings.ts
'use server'

import { db } from '@/lib/db'
import { dblocal } from '@/lib/localdb'
import { auth } from '@/lib/auth/auth'
import { desc, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { branch as localBranch, users as localUsers, settings as localSettings, doctype as loacldoctype, documents } from '@/lib/localdb/schema'
import { branch, users, settings, changeLog, doctype } from '@/lib/db/schema'
import { Session } from '@/types/types'

export async function getSession(): Promise<Session> {
    return await auth()
}

export async function getBranches() {
    const session = await auth()
    if (!session?.user) {
        throw new Error('Unauthorized')
    }

    if (session.user.role === 'admin') {
        return await dblocal.select().from(localBranch)
            .orderBy(desc(localBranch.id))
            .all()
    }
    return []
}

export async function getUsers() {
    const session = await auth()
    if (!session?.user) {
        throw new Error('Unauthorized')
    }

    if (session.user.role === 'admin') {
        return await dblocal.select().from(localUsers).all()
    }
    return []
}

export async function getSettings() {
    const session = await auth()
    if (!session?.user) {
        throw new Error('Unauthorized')
    }

    return await dblocal.select().from(localSettings).all()
}

export async function getDocTypes() {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const result = await dblocal
        .select({
            id: doctype.id,
            type: doctype.type,
            createdAt: doctype.createdAt,
            updatedAt: doctype.updatedAt,
            count: sql<number>`COUNT(${documents.id})`.as("count")
        })
        .from(doctype)
        .leftJoin(documents, sql`LOWER(${documents.type}) = LOWER(${doctype.type})`)
        .groupBy(doctype.id)

    return result
}

export async function addBranch(formData: FormData) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
        throw new Error('Unauthorized')
    }

    const name = formData.get('name') as string
    let zone = formData.get('zone') as string
    if (!zone.toLowerCase().startsWith('zone') && /^\d+$/.test(zone.trim())) {
        zone = `Zone ${zone.trim()}`
    }



    if (!name || !zone) {
        throw new Error('Name and zone are required')
    }

    try {
        // Add to local DB
        await dblocal.insert(localBranch).values({
            name,
            zone,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }).run()

        // Add to main DB
        await db.insert(branch).values({
            name,
            zone
        })

        revalidatePath('/settings')
        return { success: true, message: 'Branch added successfully' }
    } catch (error) {
        console.error('Failed to add branch:', error)
        return { success: false, message: 'Failed to add branch' }
    }
}

export async function deleteBranch(formData: FormData) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
        return { success: false, message: 'Unauthorized' }
    }

    const name = formData.get('name') as string

    if (!name) {
        return { success: false, message: 'Branch name is required' }
    }

    try {
        // 1. Fetch the branch to get its ID
        const branchToDelete = await db.select().from(branch).where(eq(branch.name, name)).get();

        if (!branchToDelete) {
            throw new Error("Branch not found");
        }

        // 2. Delete from local and server
        await dblocal.delete(localBranch).where(eq(localBranch.name, name)).run();
        await db.delete(branch).where(eq(branch.name, name)).run();

        // 3. Insert into change log
        await db.insert(changeLog).values({
            tableName: 'branch',
            recordId: branchToDelete.id,
            changeType: 'delete',
            changedAt: new Date().toISOString(),
            changedBy: session.user.id,
        });


        revalidatePath('/settings')
        return { success: true, message: 'Branch deleted successfully' }
    } catch (error) {
        console.error('Failed to delete branch:', error)
        return { success: false, message: 'Failed to delete branch' }
    }
}

// update
export async function updateBranch(formData: FormData) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
        return { success: false, message: 'Unauthorized' }
    }

    const name = formData.get('branch') as string
    const zone = formData.get('zone') as string

    if (!name || !zone) {
        return { success: false, message: 'Name and zone are required' }
    }

    try {
        await dblocal.update(localBranch)
            .set({
                zone, updatedAt: new Date().toISOString()
            })
            .where(eq(localBranch.name, name))
            .run()

        await db.update(branch)
            .set({ zone })
            .where(eq(branch.name, name))

        revalidatePath('/settings')
        return { success: true, message: 'Branch updated successfully' }
    } catch (error) {
        console.error('Failed to update branch:', error)
        return { success: false, message: 'Failed to update branch' }
    }
}


export async function updateUser(formData: FormData) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
        throw new Error('Unauthorized')
    }

    const userId = formData.get('userId') as string
    const role = formData.get('role') as string
    const branch = formData.get('branch') as string
    const branchName = branch === 'none' ? null : branch
    const zone = formData.get('zone') as string
    const zoneName = zone === 'none' ? null : zone
    const canUpload = formData.get('canUpload') === 'on'

    if (!userId || !role) {
        throw new Error('User ID and role are required')
    }



    try {
        // Update in local DB
        await dblocal.update(localUsers)
            .set({
                role: role as "branch" | "zonal_head" | "admin",
                branch: branchName || null,
                zone: zoneName || null,
                canUpload,
                updatedAt: String(new Date().toISOString())
            })
            .where(eq(localUsers.id, Number(userId)))
            .run()

        // Update in main DB
        const user = await db.update(users)
            .set({
                role: role as "branch" | "zonal_head" | "admin",
                branch: branchName || null,
                zone: zoneName || null,
                canUpload,
                updatedAt: new Date().toISOString()
            })
            .where(eq(users.id, Number(userId))).returning()

        revalidatePath('/settings')
        return { success: true, message: 'User updated successfully', user: user }
    } catch (error) {
        console.error('Failed to update user:', error)
        throw new Error('Failed to update user')
    }
}




export type LoadDataFromServer = {
    session: Awaited<ReturnType<typeof getSession>>
    branches: Awaited<ReturnType<typeof getBranches>>
    users: Awaited<ReturnType<typeof getUsers>>
    settings: Awaited<ReturnType<typeof getSettings>>
    doctypes: Awaited<ReturnType<typeof getDocTypes>>
}

export async function LoadDataFromServer(): Promise<LoadDataFromServer> {
    const [sessionData, branchesData, usersData, settingsData, doctypes] = await Promise.all([
        getSession(),
        getBranches(),
        getUsers(),
        getSettings(),
        getDocTypes()
    ])
    return {
        session: sessionData,
        branches: branchesData,
        users: usersData,
        settings: settingsData,
        doctypes: doctypes
    }
}
export async function addSetting(formData: FormData) {
    const key = formData.get('finalKey') as string
    let value = formData.get('value') as string


    try {
        const existing = await db.select()
            .from(settings)
            .where(eq(settings.key, key))
            .then(res => res[0])

        if (existing) {
            return { success: false, error: 'Setting already exists' }
        }

        // Insert new setting
        const setting = await db.insert(settings)
            .values({
                key,
                value,
            }).returning()

        await dblocal.insert(localSettings).values({
            id: setting[0].id,
            value,
            key,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        })
        revalidatePath('/settings')
        return { success: true }
    } catch (error) {
        console.error('Error adding setting:', error)
        return { success: false, error: 'Failed to add setting' }
    }
}
export async function updateSetting(formData: FormData) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
        return { success: false, error: 'Unauthorized' }
    }

    const key = formData.get('key') as string | null
    const value = formData.get('value') as string | null

    if (!key) {
        return { success: false, error: 'Setting key is required' }
    }
    if (!value) {
        return { success: false, error: 'Setting value is required' }
    }

    try {

        await dblocal.update(localSettings)
            .set({
                value,
                updatedAt: new Date().toISOString()
            })
            .where(eq(localSettings.key, key))
            .run()

        await db.update(settings)
            .set({
                value,
            })
            .where(eq(settings.key, key))


        revalidatePath('/settings')

        return { success: true, message: 'Setting updated successfully' }
    } catch (error) {
        console.error('Failed to update setting:', error)
        return { success: false, error: 'Failed to update setting' }
    }
}

export async function deleteSetting(formData: FormData) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
        return { success: false, error: 'Unauthorized' }
    }

    const key = formData.get('key') as string | null

    if (!key) {
        return { success: false, error: 'Setting key is required' }
    }

    try {
        // Delete from local DB
        await dblocal
            .delete(localSettings)
            .where(eq(localSettings.key, key))
            .run()

        // Delete from main DB
        await db
            .delete(settings)
            .where(eq(settings.key, key))

        revalidatePath('/settings')

        return { success: true, message: 'Setting deleted successfully', key }
    } catch (error) {
        console.error('Failed to delete setting:', error)
        return { success: false, error: 'Failed to delete setting' }
    }
}

export async function addDocType(formData: FormData) {
    const type = formData.get('type') as string

    if (!type) return { success: false, error: 'Type is required' }

    try {
        const newdoctype = await db.insert(doctype).values({
            type,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }).returning()

        await dblocal.insert(loacldoctype).values({
            id: newdoctype[0].id,
            type,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })
        revalidatePath('/settings') // or wherever this is shown
        return { success: true }
    } catch (error: any) {
        console.error('Failed to add doc type:', error)
        if (error.message.includes('UNIQUE')) {
            return { success: false, error: 'Type already exists' }
        }
        return { success: false, error: 'Failed to add type' }
    }
}

export async function deleteDocType(formData: FormData) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
        return { success: false, error: 'Unauthorized' }
    }
    const id = Number(formData.get('id'))

    if (!id) return { success: false, error: 'ID is required' }

    try {
        await db.delete(doctype).where(eq(doctype.id, id))
        await dblocal.delete(loacldoctype).where(eq(loacldoctype.id, id))

        await db.insert(changeLog).values({
            tableName: 'doctype',
            recordId: id,
            changeType: 'delete',
            changedAt: new Date().toISOString(),
            changedBy: session.user.id,
        });

        revalidatePath('/settings')
        return { success: true, id }
    } catch (error) {
        console.error('Failed to delete doc type:', error)
        return { success: false, error: 'Failed to delete type' }
    }
}