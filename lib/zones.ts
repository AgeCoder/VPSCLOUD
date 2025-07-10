export const ZONE_MAPPING = {
  "Zone 1": ["TAKALI", "DHAVALI", "KHANDERAJURI", "MALGAON", "BEDAG", "MIRAJ", "SALGARE", "MAISHAL", "ARAG"],
  "Zone 2": [
    "SANGLI",
    "KUPWAD",
    "MALWADI",
    "DUDHGAON",
    "GAONBHAG",
    "ASHATA",
    "PA. NAGAR",
    "KASABEDIGRAJ",
    "Vishrambag",
  ],
  "Zone 3": ["SAMDOLI", "BRAMHNAL", "KAVLAPUR", "KAVTHE AKAND", "NANDRE", "BHOSE", "BHILVADI", "BURLI"],
}

export function getBranchZone(branch: string): string | null {
  for (const [zone, branches] of Object.entries(ZONE_MAPPING)) {
    if (branches.includes(branch)) {
      return zone
    }
  }
  return null
}

export function getAllBranches(): string[] {
  return Object.values(ZONE_MAPPING).flat()
}

export function getBranchesByZone(zone: string): string[] {
  return ZONE_MAPPING[zone as keyof typeof ZONE_MAPPING] || []
}
