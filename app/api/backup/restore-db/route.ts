import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic'; // static by default, unless reading the request

export async function POST(request: Request) {
    try {
        // Create backups directory if it doesn't exist
        const backupDir = path.join(process.cwd(), 'backups');
        try {
            await fs.access(backupDir);
        } catch {
            await fs.mkdir(backupDir);
        }

        // Get uploaded file
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const currentDbPath = path.join(process.cwd(), 'sqlite.db');
        const backupPath = path.join(backupDir, `backup-${Date.now()}.db`);

        // Create backup of current DB
        try {
            const currentDb = await fs.readFile(currentDbPath);
            await fs.writeFile(backupPath, currentDb);
        } catch (err) {
            console.warn('No existing database to backup');
        }

        // Write new DB
        await fs.writeFile(currentDbPath, buffer);

        return NextResponse.json({
            message: 'Database restored successfully',
            backupCreated: backupPath,
        });
    } catch (error) {
        console.error('Database restore error:', error);
        return NextResponse.json(
            { error: 'Failed to restore database' },
            { status: 500 }
        );
    }
}