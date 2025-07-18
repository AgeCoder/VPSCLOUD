// adjust path as needed

import { getAllBranches, getBranchesByZone } from "./zones"



// ⚠️ Must be async because zone data is now from DB
export async function canAccessDocument(
  userRole: string,
  userZone: string | null,
  userBranch: string | null,
  documentBranch: string,
  documentZone: string
): Promise<boolean> {
  switch (userRole) {
    case "admin":
      return true

    case "zonal_head":
      if (!userZone) return false
      const zoneBranches = await getBranchesByZone(userZone)
      return zoneBranches.includes(documentBranch)

    case "branch":
      return userBranch === documentBranch

    default:
      return false
  }
}

// ✅ Async version to get branches the user can access
export async function getAccessibleBranches(
  userRole: string,
  userZone: string | null,
  userBranch: string | null
): Promise<string[]> {
  switch (userRole) {
    case "admin":
      return await getAllBranches()

    case "zonal_head":
      return userZone ? await getBranchesByZone(userZone) : []

    case "branch":
      return userBranch ? [userBranch] : []

    default:
      return []
  }
}
