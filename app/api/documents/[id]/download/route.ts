// original download handler

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { accessLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSignedDownloadUrl } from "@/lib/cloudflare/r2";

import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { dblocal } from "@/lib/localdb";
import { documents } from "@/lib/localdb/schema";
import { decryptFile } from "@/lib/cloudflare/encryption";
import { canAccessDocument } from "@/lib/auth/access-control";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const [doc] = await dblocal
      .select()
      .from(documents)
      .where(eq(documents.id, Number(id)))
      .limit(1);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const hasAccess = await canAccessDocument(
      session.user.role,
      session.user.zone,
      session.user.branch,
      doc.branch,
      doc.zone,
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const fileExt = path.extname(doc.originalFilename);
    const decryptedDir = path.join(process.cwd(), "decrypted-files");
    const localFile = `${doc.filename}${fileExt}`;
    const localPath = path.join(decryptedDir, localFile);
    const fileExists = existsSync(localPath);

    const origin = request.nextUrl.origin;

    if (!fileExists) {
      const signedUrl = await getSignedDownloadUrl(doc.r2Key);
      const response = await fetch(signedUrl);
      if (!response.ok) {
        return NextResponse.json({ error: "Remote file fetch failed" }, { status: 404 });
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const decrypted = await decryptFile(buffer, doc.iv, doc.tag);

      await fs.mkdir(decryptedDir, { recursive: true });
      await fs.writeFile(localPath, decrypted);
    }

    await db.insert(accessLogs).values({
      userId: session.user.id,
      fileId: doc.id,
      action: "download",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.redirect(`${origin}/api/documents/decrypted-files/${encodeURIComponent(localFile)}`);
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
