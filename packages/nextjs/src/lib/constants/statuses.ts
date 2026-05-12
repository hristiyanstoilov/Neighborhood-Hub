export const SkillStatus = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  RETIRED: 'retired',
} as const

export const SkillRequestStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export const ToolStatus = {
  AVAILABLE: 'available',
  BORROWED: 'borrowed',
  RETIRED: 'retired',
} as const

export const ToolReservationStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  ACTIVE: 'active',
  RETURNED: 'returned',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
} as const

export const FoodShareStatus = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  CONSUMED: 'consumed',
  EXPIRED: 'expired',
} as const

export const FoodReservationStatus = {
  PENDING: 'pending',
  RESERVED: 'reserved',
  PICKED_UP: 'picked_up',
  CANCELLED: 'cancelled',
} as const

export const EventStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
} as const

export const DriveStatus = {
  OPEN: 'open',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const
