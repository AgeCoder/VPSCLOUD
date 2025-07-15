import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST() {
    try {
        const projectRoot = process.cwd()
        const dbPath = path.join(projectRoot, 'sqlite.db')
        const resetDbPath = path.join(projectRoot, 'reset.db')
        const backupDir = path.join(projectRoot, 'backups')

        // Ensure backup directory exists
        try {
            await fs.access(backupDir)
        } catch {
            await fs.mkdir(backupDir)
        }

        // Backup current DB if exists
        try {
            const currentDb = await fs.readFile(dbPath)
            const backupFilePath = path.join(backupDir, `backup-${Date.now()}.db`)
            await fs.writeFile(backupFilePath, currentDb)
        } catch {
            console.warn('No current database found to backup.')
        }

        // Copy reset.db to overwrite sqlite.db
        const resetDb = await fs.readFile(resetDbPath)
        await fs.writeFile(dbPath, resetDb)

        return NextResponse.json({
            message: 'Database has been reset from reset.db',
        })
    } catch (err) {
        console.error('DB Reset Error:', err)
        return NextResponse.json(
            { error: 'Failed to reset database' },
            { status: 500 }
        )
    }
}
