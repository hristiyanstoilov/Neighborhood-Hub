/**
 * Central query key registry for TanStack Query.
 *
 * Rules:
 * - Keys are arrays, always starting with a domain string
 * - More specific keys extend less specific ones (enables targeted invalidation)
 * - User-scoped keys include userId to prevent cache bleed between accounts
 *
 * Example invalidation patterns:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.skills.all })
 *   queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread(userId) })
 */

export const queryKeys = {
  skills: {
    all:    ['skills'] as const,
    list:   (filters: Record<string, unknown>) => ['skills', 'list', filters] as const,
    detail: (id: string)                        => ['skills', 'detail', id] as const,
  },

  skillRequests: {
    all:    ['skill-requests'] as const,
    list:   (userId: string, role: string) => ['skill-requests', 'list', userId, role] as const,
  },

  tools: {
    all:            ['tools'] as const,
    list:           (filters: Record<string, unknown>) => ['tools', 'list', filters] as const,
    detail:         (id: string)                        => ['tools', 'detail', id] as const,
    myReservations: (userId: string, role: string)      => ['tools', 'my-reservations', userId, role] as const,
  },

  events: {
    all:     ['events'] as const,
    list:    (status: string) => ['events', 'list', status] as const,
    detail:  (id: string)     => ['events', 'detail', id] as const,
    myRsvps: (userId: string) => ['events', 'my-rsvps', userId] as const,
  },

  drives: {
    all:        ['drives'] as const,
    list:       (status: string, driveType: string | null) => ['drives', 'list', status, driveType ?? ''] as const,
    detail:     (id: string)     => ['drives', 'detail', id] as const,
    pledges:    (driveId: string) => ['drives', 'pledges', driveId] as const,
    myPledges:  (userId: string)  => ['drives', 'my-pledges', userId] as const,
  },

  food: {
    all:             ['food'] as const,
    list:            (filters: Record<string, unknown>) => ['food', 'list', filters] as const,
    detail:          (id: string)    => ['food', 'detail', id] as const,
    reservations:    (shareId: string) => ['food', 'reservations', shareId] as const,
    myReservations:  (userId: string)  => ['food', 'my-reservations', userId] as const,
  },

  notifications: {
    all:    ['notifications'] as const,
    unread: (userId: string) => ['notifications', 'unread', userId] as const,
    list:   (userId: string) => ['notifications', 'list', userId] as const,
  },

  profile: {
    me:     () => ['profile', 'me'] as const,
    public: (userId: string) => ['profile', 'public', userId] as const,
  },

  chat: {
    all:           ['chat'] as const,
    conversations: (userId: string) => ['chat', 'conversations', userId] as const,
    messages:      (conversationId: string) => ['chat', 'messages', conversationId] as const,
  },

  ratings: {
    all: ['ratings'] as const,
    byUser: (userId: string, limit: number, offset: number) =>
      ['ratings', 'user', userId, limit, offset] as const,
    check: (userId: string, contextType: string, contextId: string) =>
      ['ratings', 'check', userId, contextType, contextId] as const,
  },

  search: {
    all: ['search'] as const,
    results: (q: string, types?: string, locationId?: string) =>
      ['search', 'results', q, types ?? 'all', locationId ?? 'all'] as const,
  },
} as const
