import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  fetchMyStats,
  statsKeys,
  BADGE_TYPES,
  BADGE_LABELS,
  BADGE_CRITERIA,
  BADGE_COLORS,
  LEVEL_THRESHOLDS,
  type BadgeType,
  type UserBadge,
} from '../../../lib/queries/stats'

function levelProgress(points: number, level: number): number {
  const current = LEVEL_THRESHOLDS[level - 1] ?? 0
  const next = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  if (next <= current) return 1
  return Math.min((points - current) / (next - current), 1)
}

function nextLevelPoints(points: number, level: number): number | null {
  const next = LEVEL_THRESHOLDS[level]
  return next != null ? next - points : null
}

function StatsCard({
  totalPoints,
  level,
  rank,
  totalUsers,
}: {
  totalPoints: number
  level: number
  rank: number | null
  totalUsers: number
}) {
  const progress = levelProgress(totalPoints, level)
  const toNext = nextLevelPoints(totalPoints, level)

  return (
    <View style={styles.statsCard}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>Level {level}</Text>
          <Text style={styles.statLabel}>of 6</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{rank != null ? `#${rank}` : '—'}</Text>
          <Text style={styles.statLabel}>of {totalUsers}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          {toNext != null
            ? `${toNext} pts to Level ${level + 1}`
            : 'Max level reached'}
        </Text>
      </View>
    </View>
  )
}

function BadgeCard({ badge }: { badge: UserBadge }) {
  const colors = BADGE_COLORS[badge.type]
  const label = BADGE_LABELS[badge.type]
  const date = new Date(badge.awardedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <View style={[styles.badgeCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={[styles.badgeDot, { backgroundColor: colors.dot }]} />
      <View style={styles.badgeInfo}>
        <Text style={[styles.badgeLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.badgeDate, { color: colors.text }]}>Earned {date}</Text>
      </View>
    </View>
  )
}

function LockedBadgeCard({ type }: { type: BadgeType }) {
  return (
    <View style={styles.lockedCard}>
      <View style={styles.lockedDot} />
      <View style={styles.badgeInfo}>
        <Text style={styles.lockedLabel}>{BADGE_LABELS[type]}</Text>
        <Text style={styles.lockedCriteria}>{BADGE_CRITERIA[type]}</Text>
      </View>
    </View>
  )
}

export default function AchievementsScreen() {
  const router = useRouter()

  const statsQuery = useQuery({
    queryKey: statsKeys.me(),
    queryFn: fetchMyStats,
  })

  if (statsQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    )
  }

  if (statsQuery.isError || !statsQuery.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load achievements.</Text>
        <Text style={styles.retryText} onPress={() => { void statsQuery.refetch() }}>
          Tap to retry
        </Text>
      </View>
    )
  }

  const { totalPoints, level, rank, totalUsers, badges } = statsQuery.data
  const earnedTypes = new Set(badges.map((b) => b.type))
  const lockedTypes = BADGE_TYPES.filter((t) => !earnedTypes.has(t))

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={statsQuery.isRefetching}
          onRefresh={() => { void statsQuery.refetch() }}
          tintColor="#15803d"
        />
      }
    >
      <StatsCard
        totalPoints={totalPoints}
        level={level}
        rank={rank}
        totalUsers={totalUsers}
      />

      {badges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earned — {badges.length} / {BADGE_TYPES.length}</Text>
          {badges.map((badge) => (
            <BadgeCard key={badge.type} badge={badge} />
          ))}
        </View>
      )}

      {lockedTypes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {badges.length === 0 ? `Badges — 0 / ${BADGE_TYPES.length}` : 'Locked'}
          </Text>
          {lockedTypes.map((type) => (
            <LockedBadgeCard key={type} type={type} />
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    color: '#6b7280',
  },
  retryText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '600',
  },

  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 18,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  progressContainer: {
    gap: 6,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#15803d',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'right',
  },

  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  badgeInfo: {
    flex: 1,
    gap: 2,
  },
  badgeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgeDate: {
    fontSize: 11,
    opacity: 0.75,
  },

  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  lockedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d1d5db',
    flexShrink: 0,
  },
  lockedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  lockedCriteria: {
    fontSize: 11,
    color: '#9ca3af',
  },
})
