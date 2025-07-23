import { auth } from "@/lib/auth/auth";
import { dblocal } from "@/lib/localdb";
import { branch, doctype, documents } from "@/lib/localdb/schema";
import { sql, and, eq, inArray } from "drizzle-orm";
import { getAccessibleBranches } from "@/lib/auth/access-control";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();
        const user = session?.user;

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!user.id || !user.role) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "admin" && user.role !== "zonal_head") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }


        // Get accessible branches based on role
        const accessibleBranches = await getAccessibleBranches(user.role, user.zone, user.branch);

        if (accessibleBranches.length === 0) {
            return NextResponse.json([], { status: 200 });
        }

        // Step 1: Get distinct years for accessible branches only
        const distinctYears = await dblocal
            .selectDistinct({ year: documents.year })
            .from(documents)
            .where(inArray(documents.branch, accessibleBranches))
            .then(rows => rows.map(row => row.year).filter(Boolean));

        if (distinctYears.length === 0) {
            return NextResponse.json([], { status: 200 });
        }

        const filteredYears = distinctYears.filter((y): y is string => typeof y === "string");
        // Step 2: Get report only for accessible branches
        const result = await dblocal
            .select({
                zone: branch.zone,
                branch: branch.name,
                year: documents.year,
                type: doctype.type,
                count: sql<number>`COUNT(${documents.id})`.as("count"),
            })
            .from(branch)
            .crossJoin(doctype)
            .leftJoin(
                documents,
                and(
                    eq(documents.branch, branch.name),
                    eq(documents.zone, branch.zone),
                    eq(documents.type, doctype.type),
                    inArray(documents.branch, accessibleBranches),
                    inArray(documents.year, filteredYears)

                )
            )
            .where(inArray(branch.name, accessibleBranches))
            .groupBy(branch.zone, branch.name, documents.year, doctype.type)
            .all();

        const formattedResult = result.map(row => ({
            zone: row.zone,
            branch: row.branch,
            year: row.year,
            type: row.type,
            count: Number(row.count) || 0
        }));

        return new Response(JSON.stringify(formattedResult), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Error fetching document report:", error);
        return new Response(JSON.stringify({
            error: "Failed to fetch document report",
            details: error instanceof Error ? error.message : String(error)
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
