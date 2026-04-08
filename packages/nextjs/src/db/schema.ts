import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  char,
  inet,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ─────────────────────────────────────────────
// ENUMS — only for stable binary fields
// ─────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['user', 'admin'])
export const aiMessageRoleEnum = pgEnum('ai_message_role', ['user', 'assistant'])

// ─────────────────────────────────────────────
// 1. USERS
// ─────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').default('user').notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    emailVerificationToken: varchar('email_verification_token', { length: 64 }),
    emailVerificationExpiresAt: timestamp('email_verification_expires_at', { withTimezone: true }),
    passwordResetToken: varchar('password_reset_token', { length: 64 }),
    passwordResetExpiresAt: timestamp('password_reset_expires_at', { withTimezone: true }),
    failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('users_email_idx').on(t.email),
    index('users_active_idx').on(t.id).where(sql`${t.deletedAt} IS NULL`),
    check('users_email_format', sql`${t.email} ~ '^[^@]+@[^@]+\\.[^@]+$'`),
  ]
)

// ─────────────────────────────────────────────
// 2. LOCATIONS
// ─────────────────────────────────────────────

export const locations = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    city: varchar('city', { length: 100 }).notNull(),
    neighborhood: varchar('neighborhood', { length: 100 }).notNull(),
    lat: numeric('lat', { precision: 9, scale: 6 }).notNull(),
    lng: numeric('lng', { precision: 9, scale: 6 }).notNull(),
    countryCode: char('country_code', { length: 2 }).default('BG').notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('locations_city_neighborhood_type_idx').on(t.city, t.neighborhood, t.type),
    index('locations_lat_lng_idx').on(t.lat, t.lng),
    check(
      'locations_type_check',
      sql`${t.type} IN ('skill_location', 'event_location', 'thing_location', 'food_location', 'neighborhood')`
    ),
  ]
)

// ─────────────────────────────────────────────
// 3. PROFILES
// ─────────────────────────────────────────────

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }),
  bio: text('bio'),
  avatarUrl: varchar('avatar_url', { length: 2048 }),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'set null' }),
  isPublic: boolean('is_public').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─────────────────────────────────────────────
// 4. REFRESH TOKENS
// ─────────────────────────────────────────────

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    isRevoked: boolean('is_revoked').default(false).notNull(),
    userAgent: text('user_agent'),
    ipAddress: inet('ip_address'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('refresh_tokens_user_id_idx').on(t.userId),
    uniqueIndex('refresh_tokens_token_idx').on(t.token),
    index('refresh_tokens_expires_at_idx').on(t.expiresAt),
    check('refresh_tokens_expiry_check', sql`${t.expiresAt} > ${t.createdAt}`),
  ]
)

// ─────────────────────────────────────────────
// 5. AUDIT LOG
// ─────────────────────────────────────────────

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    userEmail: varchar('user_email', { length: 255 }),
    action: varchar('action', { length: 100 }).notNull(),
    entity: varchar('entity', { length: 100 }),
    entityId: uuid('entity_id'),
    metadata: jsonb('metadata'),
    ipAddress: inet('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('audit_log_user_id_idx').on(t.userId),
    index('audit_log_created_at_idx').on(t.createdAt),
    check(
      'audit_log_action_check',
      sql`${t.action} IN ('create', 'update', 'delete', 'login', 'logout', 'register', 'verify_email', 'reset_password')`
    ),
  ]
)

// ─────────────────────────────────────────────
// 6. CATEGORIES
// ─────────────────────────────────────────────

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    label: varchar('label', { length: 200 }).notNull(),
    icon: varchar('icon', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('categories_slug_idx').on(t.slug)]
)

// ─────────────────────────────────────────────
// 7. USER CONSENTS
// ─────────────────────────────────────────────

export const userConsents = pgTable(
  'user_consents',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    consentType: varchar('consent_type', { length: 100 }).notNull(),
    granted: boolean('granted').notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    ipAddress: inet('ip_address'),
    version: varchar('version', { length: 20 }).notNull(),
  },
  (t) => [
    uniqueIndex('user_consents_unique_idx').on(t.userId, t.consentType, t.version),
    check(
      'user_consents_type_check',
      sql`${t.consentType} IN ('terms', 'marketing', 'analytics', 'ai_data')`
    ),
  ]
)

// ─────────────────────────────────────────────
// 8. SKILLS
// ─────────────────────────────────────────────

export const skills = pgTable(
  'skills',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    categoryId: uuid('category_id').references(() => categories.id),
    availableHours: integer('available_hours').notNull(),
    status: varchar('status', { length: 20 }).default('available').notNull(),
    imageUrl: varchar('image_url', { length: 2048 }),
    locationId: uuid('location_id').references(() => locations.id, { onDelete: 'set null' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('skills_owner_id_idx').on(t.ownerId),
    index('skills_status_idx').on(t.status).where(sql`${t.deletedAt} IS NULL`),
    index('skills_category_id_idx').on(t.categoryId),
    index('skills_location_id_idx').on(t.locationId).where(sql`${t.deletedAt} IS NULL`),
    check('skills_status_check', sql`${t.status} IN ('available', 'busy', 'retired')`),
    check('skills_hours_check', sql`${t.availableHours} >= 0 AND ${t.availableHours} <= 168`),
    check('skills_title_length_check', sql`char_length(${t.title}) >= 3`),
  ]
)

// ─────────────────────────────────────────────
// 9. SKILL REQUESTS
// ─────────────────────────────────────────────

export const skillRequests = pgTable(
  'skill_requests',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userFromId: uuid('user_from_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userToId: uuid('user_to_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'restrict' }),
    scheduledStart: timestamp('scheduled_start', { withTimezone: true }).notNull(),
    scheduledEnd: timestamp('scheduled_end', { withTimezone: true }).notNull(),
    meetingType: varchar('meeting_type', { length: 20 }).notNull(),
    meetingUrl: varchar('meeting_url', { length: 2048 }),
    status: varchar('status', { length: 20 }).default('pending').notNull(),
    notes: text('notes'),
    cancellationReason: text('cancellation_reason'),
    cancelledById: uuid('cancelled_by_id').references(() => users.id, { onDelete: 'set null' }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('skill_requests_user_from_idx').on(t.userFromId),
    index('skill_requests_user_to_idx').on(t.userToId),
    index('skill_requests_skill_id_idx').on(t.skillId),
    index('skill_requests_status_idx').on(t.status),
    index('skill_requests_user_from_status_idx').on(t.userFromId, t.status),
    index('skill_requests_user_to_status_idx').on(t.userToId, t.status),
    uniqueIndex('skill_requests_active_request_idx')
      .on(t.skillId, t.userFromId)
      .where(sql`${t.status} IN ('pending', 'accepted')`),
    check(
      'skill_requests_status_check',
      sql`${t.status} IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')`
    ),
    check(
      'skill_requests_meeting_type_check',
      sql`${t.meetingType} IN ('in_person', 'online', 'hybrid')`
    ),
    check(
      'skill_requests_meeting_url_check',
      sql`${t.meetingType} = 'in_person' OR (${t.meetingType} IN ('online', 'hybrid') AND ${t.meetingUrl} IS NOT NULL)`
    ),
    check('skill_requests_time_check', sql`${t.scheduledEnd} > ${t.scheduledStart}`),
    check('skill_requests_self_check', sql`${t.userFromId} != ${t.userToId}`),
  ]
)

// ─────────────────────────────────────────────
// 10. NOTIFICATIONS
// ─────────────────────────────────────────────

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }).default('skill_request').notNull(),
    entityId: uuid('entity_id'),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('notifications_user_id_idx').on(t.userId),
    index('notifications_unread_idx').on(t.userId, t.isRead).where(sql`${t.isRead} = false`),
    check(
      'notifications_type_check',
      sql`${t.type} IN ('request_accepted', 'request_rejected', 'new_request', 'request_cancelled', 'request_completed')`
    ),
  ]
)

// ─────────────────────────────────────────────
// 11. AI CONVERSATIONS
// ─────────────────────────────────────────────

export const aiConversations = pgTable(
  'ai_conversations',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('ai_conversations_user_id_idx').on(t.userId)]
)

// ─────────────────────────────────────────────
// 12. AI MESSAGES
// ─────────────────────────────────────────────

export const aiMessages = pgTable(
  'ai_messages',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => aiConversations.id, { onDelete: 'cascade' }),
    role: aiMessageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('ai_messages_conversation_id_idx').on(t.conversationId)]
)
