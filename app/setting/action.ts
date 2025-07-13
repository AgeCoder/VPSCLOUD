// app/actions/settings.ts
'use server'

import { db } from '@/lib/db'
import { dblocal } from '@/lib/localdb'
import { auth } from '@/lib/auth'
import { desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { branch as localBranch, users as localUsers, settings as localSettings } from '@/lib/localdb/schema'
import { branch, users, settings } from '@/lib/db/schema'
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
        await dblocal.delete(localBranch).where(eq(localBranch.name, name)).run()
        await db.delete(branch).where(eq(branch.name, name))

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
    console.log(name, zone);

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
                zone: zone || null,
                canUpload,
                updatedAt: String(new Date().toISOString())
            })
            .where(eq(localUsers.id, userId))
            .run()

        // Update in main DB
        await db.update(users)
            .set({
                role: role as "branch" | "zonal_head" | "admin",
                branch: branchName || null,
                zone: zone || null,
                canUpload,
                updatedAt: new Date()
            })
            .where(eq(users.id, userId))

        revalidatePath('/settings')
        return { success: true, message: 'User updated successfully' }
    } catch (error) {
        console.error('Failed to update user:', error)
        throw new Error('Failed to update user')
    }
}


export async function updateSetting(formData: FormData) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
        throw new Error('Unauthorized')
    }

    const key = formData.get('key') as string | null
    let value = formData.get('value') as string | null

    if (!key) {
        throw new Error('Setting key is required')
    }

    try {
        const now = new Date()

        // Update local DB
        await dblocal
            .insert(localSettings)
            .values({
                key,
                value: value ?? '',
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
            })
            .onConflictDoUpdate({
                target: localSettings.key,
                set: {
                    value: value ?? '',
                    updatedAt: now.toISOString(),
                },
            })
            .run()


        // Update main DB
        await db
            .insert(settings)
            .values({ key, value: value ?? '' })
            .onConflictDoUpdate({
                target: settings.key,
                set: { value: value ?? '' },
            })

        revalidatePath('/settings')

        return { success: true, message: 'Setting updated successfully' }
    } catch (error) {
        console.error('Failed to update setting:', error)
        return { success: false, message: 'Failed to update setting' }
    }
}

export type LoadDataFromServer = {
    session: Awaited<ReturnType<typeof getSession>>
    branches: Awaited<ReturnType<typeof getBranches>>
    users: Awaited<ReturnType<typeof getUsers>>
    settings: Awaited<ReturnType<typeof getSettings>>
}

export async function LoadDataFromServer(): Promise<LoadDataFromServer> {
    const [sessionData, branchesData, usersData, settingsData] = await Promise.all([
        getSession(),
        getBranches(),
        getUsers(),
        getSettings()
    ])
    return {
        session: sessionData,
        branches: branchesData,
        users: usersData,
        settings: settingsData
    }
}
export async function addSetting(formData: FormData) {
    const key = formData.get('finalKey') as string
    let value = formData.get('value') as string
    const isDocumentType = formData.get('isDocumentType') === 'on'
    console.log(key);
    if (isDocumentType && value != 'DOC_TYPE_') {
        value = 'DOC_TYPE_'
    }
    console.log(value);

    try {
        const existing = await db.select()
            .from(settings)
            .where(eq(settings.key, key))
            .then(res => res[0])

        if (existing) {
            return { success: false, error: 'Setting already exists' }
        }

        // Insert new setting
        await db.insert(settings)
            .values({
                key,
                value,
            })
        await dblocal.insert(localSettings).values({
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