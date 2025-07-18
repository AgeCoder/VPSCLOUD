import { dblocal } from "@/lib/localdb"; // adjust based on your project structure
import { branch } from "@/lib/localdb/schema";
import { eq } from "drizzle-orm";

// 🔁 Fetch entire zone → branch mapping
export async function getZoneMapping(): Promise<Record<string, string[]>> {
  const data = await dblocal.select().from(branch);

  const zoneMap: Record<string, string[]> = {};

  for (const row of data) {
    if (!zoneMap[row.zone]) {
      zoneMap[row.zone] = [];
    }
    zoneMap[row.zone].push(row.name);
  }

  return zoneMap;
}

// 🔁 Get zone name for a specific branch
export async function getBranchZone(branchName: string): Promise<string | null> {
  const result = await dblocal
    .select({ zone: branch.zone })
    .from(branch)
    .where(eq(branch.name, branchName));

  return result[0]?.zone || null;
}

// 🔁 Get all branches across all zones
export async function getAllBranches(): Promise<string[]> {
  const data = await dblocal.select({ name: branch.name }).from(branch);
  return data.map((b) => b.name);
}

// 🔁 Get all branches for a given zone
export async function getBranchesByZone(zone: string): Promise<string[]> {

  const data = await dblocal
    .select({ name: branch.name })
    .from(branch)
    .where(eq(branch.zone, zone))

  return data.map((b) => b.name);
}
