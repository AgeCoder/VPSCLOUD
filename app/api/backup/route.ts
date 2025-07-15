import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';



export async function backupDatabase(): Promise<{ file: Buffer; filename: string; contentType: string }> {
    try {
        const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "")
        const filename = `mess_management_backup_${timestamp}.db`
        const dbPath = "./sqlite.db" // Adjust based on your setup

        // Read database file
        const file = await fs.readFile(dbPath)



        return {
            file,
            filename,
            contentType: "application/x-sqlite3",
        }
    } catch (error) {
        console.error("Error backing up database:", error)
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to backup database: ${errorMessage}`)
    }
}

export async function POST(req: NextRequest) {
    try {
        const { file, filename, contentType } = await backupDatabase();

        return new NextResponse(file, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename=${filename}`,
                'Content-Type': contentType,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to backup database' },
            { status: 500 }
        );
    }
}

export function GET() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}
