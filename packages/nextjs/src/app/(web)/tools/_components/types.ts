export interface Tool {
  id: string
  title: string
  description: string | null
  status: string
  condition: string | null
  imageUrl: string | null
  ownerName: string | null
  categoryLabel: string | null
  locationNeighborhood: string | null
  locationCity: string | null
}

export type BuildHref = (overrides: Record<string, string | undefined>) => string
