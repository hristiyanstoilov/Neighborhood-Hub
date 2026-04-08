export interface Skill {
  id: string
  title: string
  description: string | null
  status: string
  availableHours: number | null
  imageUrl: string | null
  ownerName: string | null
  categoryLabel: string | null
  locationNeighborhood: string | null
  locationCity: string | null
}

export type BuildHref = (overrides: Record<string, string | undefined>) => string
