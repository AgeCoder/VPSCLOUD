// app/api/decrypted-files/[filename]/route.ts

import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET(request: Request, { params }: { params: { filename: string } }) {
    const { filename } = await params;
    const filePath = path.join(process.cwd(), "decrypted-files", filename);

    try {
        const fileBuffer = await fs.readFile(filePath);
        const ext = path.extname(filename).toLowerCase();
        const contentType =
            ext === ".pdf" ? "application/pdf" :
                ext === ".png" ? "image/png" :
                    ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
                        "application/octet-stream";

        return new NextResponse(fileBuffer, {
            headers: { "Content-Type": contentType },
        });
    } catch {
        return new NextResponse(JSON.stringify({ error: "File not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        });
    }
}
