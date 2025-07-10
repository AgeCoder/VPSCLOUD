import { getBranchesByZone } from "./zones"

export function canAccessDocument(
  userRole: string,
  userZone: string | null,
  userBranch: string | null,
  documentBranch: string,
  documentZone: string,
): boolean {
  switch (userRole) {
    case "admin":
      return true

    case "zonal_head":
      if (!userZone) return false
      const zoneBranches = getBranchesByZone(userZone)
      return zoneBranches.includes(documentBranch)

    case "branch":
      return userBranch === documentBranch

    default:
      return false
  }
}

export function getAccessibleBranches(userRole: string, userZone: string | null, userBranch: string | null): string[] {
  switch (userRole) {
    case "admin":
      return Object.values(require("./zones").ZONE_MAPPING).flat()

    case "zonal_head":
      return userZone ? getBranchesByZone(userZone) : []

    case "branch":
      return userBranch ? [userBranch] : []

    default:
      return []
  }
}
