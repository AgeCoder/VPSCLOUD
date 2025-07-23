import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { accessLogs, users, documents } from "@/lib/localdb/schema";
import {
  desc,
  eq,
  gte,
  lte,
  or,
  count,
  like,
} from "drizzle-orm";

import { dblocal } from "@/lib/localdb";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const searchTerm = searchParams.get("search");
    const offset = (page - 1) * limit;

    // Start query with dynamic mode for chaining .where()
    let query = dblocal
      .select({
        id: accessLogs.id,
        action: accessLogs.action,
        timestamp: accessLogs.timestamp,
        user: {
          id: users.id,
          email: users.email,
        },
        file: {
          id: documents.id,
          originalFilename: documents.originalFilename,
        },
      })
      .from(accessLogs)
      .leftJoin(users, eq(accessLogs.userId, users.id))
      .leftJoin(documents, eq(accessLogs.fileId, documents.id))
      .$dynamic();

    if (startDate) {
      query = query.where(gte(accessLogs.timestamp, new Date(startDate).toISOString()));
    }
    if (endDate) {
      query = query.where(lte(accessLogs.timestamp, new Date(endDate).toISOString()));
    }
    if (searchTerm) {
      query = query.where(
        or(
          like(users.email, `%${searchTerm}%`),
          like(documents.originalFilename, `%${searchTerm}%`),
          like(accessLogs.action, `%${searchTerm}%`)
        )
      );
    }

    const [{ count: totalCountRaw }] = await dblocal
      .select({ count: count() })
      .from(accessLogs);
    const total = Number(totalCountRaw ?? 0);

    const logs = await query
      .orderBy(desc(accessLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
