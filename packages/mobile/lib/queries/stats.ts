import { apiFetch } from '../api'

export const statsKeys = {
  me: () => ['stats', 'me'] as const,
}

export const BADGE_TYPES = [
  'first_skill',
  'first_tool',
  'first_food',
  'ten_points',
  'fifty_points',
  'five_star_giver',
  'community_hero',
  'first_event',
  'first_drive',
  'good_neighbor',
  'tool_master',
] as const

export type BadgeType = (typeof BADGE_TYPES)[number]

export const BADGE_LABELS: Record<BadgeType, string> = {
  first_skill:    'First Skill',
  first_tool:     'First Tool',
  first_food:     'Food Sharer',
  ten_points:     '10 Points',
  fifty_points:   '50 Points',
  five_star_giver:'5-Star Giver',
  community_hero: 'Community Hero',
  first_event:    'Event Goer',
  first_drive:    'Drive Supporter',
  good_neighbor:  'Good Neighbor',
  tool_master:    'Tool Master',
}

export const BADGE_CRITERIA: Record<BadgeType, string> = {
  first_skill:    'List your first skill',
  first_tool:     'List your first tool',
  first_food:     'Share your first food item',
  ten_points:     'Earn 10 points',
  fifty_points:   'Earn 50 points',
  five_star_giver:'Give a 5-star rating',
  community_hero: 'Complete 3 skill exchanges',
  first_event:    'RSVP to an event',
  first_drive:    'Pledge to a community drive',
  good_neighbor:  'Complete 5 food giveaways',
  tool_master:    'Return 3 borrowed tools',
}

export const BADGE_COLORS: Record<BadgeType, { bg: string; border: string; dot: string; text: string }> = {
  first_skill:    { bg: '#f0fdf4', border: '#a7f3d0', dot: '#10b981', text: '#065f46' },
  first_tool:     { bg: '#f0f9ff', border: '#bae6fd', dot: '#0ea5e9', text: '#075985' },
  first_food:     { bg: '#fff7ed', border: '#fed7aa', dot: '#f97316', text: '#9a3412' },
  ten_points:     { bg: '#f5f3ff', border: '#ddd6fe', dot: '#8b5cf6', text: '#4c1d95' },
  fifty_points:   { bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', text: '#78350f' },
  five_star_giver:{ bg: '#fff1f2', border: '#fecdd3', dot: '#f43f5e', text: '#881337' },
  community_hero: { bg: '#f0fdfa', border: '#99f6e4', dot: '#14b8a6', text: '#134e4a' },
  first_event:    { bg: '#eef2ff', border: '#c7d2fe', dot: '#6366f1', text: '#1e1b4b' },
  first_drive:    { bg: '#ecfeff', border: '#a5f3fc', dot: '#06b6d4', text: '#164e63' },
  good_neighbor:  { bg: '#f7fee7', border: '#d9f99d', dot: '#84cc16', text: '#3f6212' },
  tool_master:    { bg: '#fefce8', border: '#fef08a', dot: '#eab308', text: '#713f12' },
}

export const LEVEL_THRESHOLDS = [0, 10, 30, 60, 100, 200]

export type UserBadge = {
  type: BadgeType
  awardedAt: string
}

export type UserStats = {
  totalPoints: number
  level: number
  rank: number | null
  totalUsers: number
  badges: UserBadge[]
}

export async function fetchMyStats(): Promise<UserStats> {
  const res = await apiFetch('/api/me/stats')
  if (!res.ok) throw new Error('Failed to fetch stats')
  const json = await res.json() as { data: UserStats }
  return json.data
}
