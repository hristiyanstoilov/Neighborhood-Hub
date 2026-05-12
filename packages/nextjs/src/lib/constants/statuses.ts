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

export const ToolReservationStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  RETURNED: 'returned',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
} as const
