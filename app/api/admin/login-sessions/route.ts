import { NextResponse } from "next/server";
import { desc, gte, and, like, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { loginSessions } from "@/lib/db/schema";

const PAGE_SIZE = 10;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page")) || 1;
    const email = searchParams.get("email");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    // Collect all conditions in an array
    const conditions: SQL[] = [
        gte(loginSessions.loginAt, tenDaysAgo.toISOString())
    ];

    if (email) {
        conditions.push(like(loginSessions.email, `%${email}%`));
    }

    if (dateFrom) {
        conditions.push(gte(loginSessions.loginAt, new Date(dateFrom).toISOString()));
    }

    if (dateTo) {
        conditions.push(gte(loginSessions.loginAt, new Date(dateTo).toISOString()));
    }

    // Combine conditions using `and`
    const whereCondition = and(...conditions);

    try {
        const sessions = await db
            .select()
            .from(loginSessions)
            .where(whereCondition)
            .orderBy(desc(loginSessions.loginAt))
            .limit(PAGE_SIZE)
            .offset((page - 1) * PAGE_SIZE);

        const total = await db
            .select({ count: sql`count(*)` })
            .from(loginSessions)
            .where(whereCondition);

        const totalPages = Math.ceil(Number(total[0].count) / PAGE_SIZE);

        return NextResponse.json({
            success: true,
            data: {
                sessions,
                totalPages,
                currentPage: page,
            }
        });
    } catch (error) {
        console.error("Error fetching login sessions:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to fetch login sessions"
        }, { status: 500 });
    }
}
