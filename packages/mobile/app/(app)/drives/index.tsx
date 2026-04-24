import { useCallback, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import { AppScreen } from '../../../components/AppScreen'
import { PagedListView } from '../../../components/PagedListView'
import { mobileTheme } from '../../../lib/theme'
import { fetchDrivesList, drivesKeys, type DriveListItem } from '../../../lib/queries/drives'
import { formatDateOnly } from '../../../lib/format'

const PAGE_SIZE = 20

const STATUS_TABS = [
  { key: 'open',      label: 'Open' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const TYPE_CHIPS = [
  { key: null,    label: 'All' },
  { key: 'items', label: '📦 Items' },
  { key: 'food',  label: '🍎 Food' },
  { key: 'money', label: '💰 Money' },
  { key: 'other', label: '🤝 Other' },
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open:      { bg: mobileTheme.colors.statusSuccessBg, text: mobileTheme.colors.statusSuccessText },
  completed: { bg: mobileTheme.colors.statusInfoBg, text: mobileTheme.colors.statusInfoText },
  cancelled: { bg: mobileTheme.colors.statusDangerBg, text: mobileTheme.colors.statusDangerText },
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  items: { bg: '#dbeafe', text: '#1e40af' },
  food:  { bg: '#ffedd5', text: '#9a3412' },
  money: { bg: '#fef9c3', text: '#854d0e' },
  other: { bg: '#f3f4f6', text: '#374151' },
}

export default function DrivesListScreen() {
  const { user } = useAuth()
  const router   = useRouter()
  const [status,    setStatus]    = useState('open')
  const [driveType, setDriveType] = useState<string | null>(null)

  const drivesQuery = useInfiniteQuery({
    queryKey:         drivesKeys.list(status, driveType),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchDrivesList({ status, driveType, page: pageParam, limit: PAGE_SIZE }),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, p) => sum + p.data.length, 0)
      return loaded < lastPage.total ? pages.length + 1 : undefined
    },
    staleTime: 60_000,
  })

  // Use a ref so isFetching doesn't become a useCallback dep (would cause infinite refetch loop)
  const isFetchingRef = useRef(drivesQuery.isFetching)
  isFetchingRef.current = drivesQuery.isFetching

  useFocusEffect(
    useCallback(() => {
      if (isFetchingRef.current) return
      void drivesQuery.refetch()
    }, [drivesQuery.refetch, status, driveType])
  )

  const drives = useMemo(
    () => drivesQuery.data?.pages.flatMap((p) => p.data) ?? [],
    [drivesQuery.data]
  )
  const total        = drivesQuery.data?.pages[0]?.total ?? 0
  const isInitial    = drivesQuery.isFetching && !drivesQuery.data
  const isRefreshing = drivesQuery.isRefetching && !!drivesQuery.data
  const hasMore      = drives.length < total

  function handleStatusChange(newStatus: string) {
    if (newStatus === status) return
    setStatus(newStatus)
  }

  function handleTypeChange(newType: string | null) {
    if (newType === driveType) return
    setDriveType(newType)
  }

  const handleLoadMore = useCallback(() => {
    if (!hasMore || drivesQuery.isFetchingNextPage) return
    void drivesQuery.fetchNextPage()
  }, [hasMore, drivesQuery])

  function renderDrive({ item }: { item: DriveListItem }) {
    const sc = STATUS_COLORS[item.status] ?? { bg: mobileTheme.colors.canvas, text: mobileTheme.colors.textMuted }
    const tc = TYPE_COLORS[item.driveType] ?? { bg: '#f3f4f6', text: '#374151' }
    const typeLabel = TYPE_CHIPS.find((c) => c.key === item.driveType)?.label ?? item.driveType

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/drives/${item.id}`)}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: tc.bg }]}>
            <Text style={[styles.badgeText, { color: tc.text }]}>{typeLabel}</Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        {item.goalDescription ? (
          <Text style={styles.goalText} numberOfLines={1}>🎯 {item.goalDescription}</Text>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.organizer}>by {item.organizerName ?? 'Anonymous'}</Text>
          <View style={styles.cardFooterRight}>
            {item.deadline && (
              <Text style={styles.deadline}>⏰ {formatDateOnly(item.deadline)}</Text>
            )}
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <AppScreen backgroundColor={mobileTheme.colors.canvasAlt}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Drives</Text>
        {user && (
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/(app)/drives/new')}
          >
            <Text style={styles.createBtnText}>+ Start</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.chip, status === tab.key && styles.chipActive]}
              onPress={() => handleStatusChange(tab.key)}
            >
              <Text style={[styles.chipText, status === tab.key && styles.chipTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Type filter */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {TYPE_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip.key ?? 'all'}
              style={[styles.chipSmall, driveType === chip.key && styles.chipSmallActive]}
              onPress={() => handleTypeChange(chip.key)}
            >
              <Text style={[styles.chipSmallText, driveType === chip.key && styles.chipSmallTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <PagedListView
        data={drives}
        keyExtractor={(item) => item.id}
        renderItem={renderDrive}
        loading={isInitial}
        error={drivesQuery.isError}
        errorMessage="Could not load drives."
        onRetry={() => void drivesQuery.refetch()}
        refreshing={isRefreshing}
        onRefresh={() => void drivesQuery.refetch()}
        onEndReached={handleLoadMore}
        hasMore={hasMore}
        loadingMore={drivesQuery.isFetchingNextPage}
        listContentStyle={styles.list}
        emptyMessage="No drives here yet."
        emptyAction={
          user ? (
            <TouchableOpacity onPress={() => router.push('/(app)/drives/new')}>
              <Text style={styles.emptyLink}>Start the first one →</Text>
            </TouchableOpacity>
          ) : null
        }
        footer={
          <TouchableOpacity
            style={styles.loadMoreBtn}
            onPress={handleLoadMore}
            disabled={drivesQuery.isFetchingNextPage}
          >
            {drivesQuery.isFetchingNextPage
              ? <ActivityIndicator color={mobileTheme.colors.primary} />
              : <Text style={styles.loadMoreText}>Load more</Text>
            }
          </TouchableOpacity>
        }
      />

      {user && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(app)/drives/new')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: mobileTheme.colors.canvasAlt },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title:         { fontSize: 20, fontWeight: '700', color: mobileTheme.colors.textPrimary },
  createBtn:     { backgroundColor: mobileTheme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  createBtnText: { color: mobileTheme.colors.onPrimary, fontSize: 13, fontWeight: '600' },
  filterRow:     { paddingBottom: 6 },
  filterScroll:  { paddingHorizontal: 16, gap: 6 },
  chip:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: mobileTheme.colors.border, backgroundColor: mobileTheme.colors.surface },
  chipActive:    { backgroundColor: mobileTheme.colors.primary, borderColor: mobileTheme.colors.primary },
  chipText:      { fontSize: 13, color: mobileTheme.colors.textSecondary },
  chipTextActive:{ color: mobileTheme.colors.onPrimary, fontWeight: '600' },
  chipSmall:          { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: mobileTheme.colors.borderSoft, backgroundColor: mobileTheme.colors.canvasAlt },
  chipSmallActive:    { backgroundColor: mobileTheme.colors.textPrimary, borderColor: mobileTheme.colors.textPrimary },
  chipSmallText:      { fontSize: 12, color: mobileTheme.colors.textMuted },
  chipSmallTextActive:{ color: mobileTheme.colors.onPrimary, fontWeight: '600' },
  list:          { paddingBottom: 100 },
  emptyContainer:{ flex: 1 },
  card: {
    backgroundColor: mobileTheme.colors.surface,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    padding: 14,
    shadowColor: mobileTheme.colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  cardTitle:  { flex: 1, fontSize: 15, fontWeight: '600', color: mobileTheme.colors.textPrimary },
  badge:      { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:  { fontSize: 11, fontWeight: '500' },
  cardDesc:   { fontSize: 13, color: '#4b5563', marginBottom: 4 },
  goalText:   { fontSize: 12, color: mobileTheme.colors.textMuted, fontStyle: 'italic', marginBottom: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cardFooterRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  organizer:  { fontSize: 12, color: mobileTheme.colors.textSubtle },
  deadline:   { fontSize: 11, color: mobileTheme.colors.textSubtle },
  statusBadge:{ borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '600' },
  loadMoreBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: mobileTheme.colors.primarySoft,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: mobileTheme.colors.primarySoftBorder,
  },
  loadMoreText: { color: mobileTheme.colors.primary, fontWeight: '500', fontSize: 14 },
  emptyLink:  { fontSize: 13, color: mobileTheme.colors.primary, fontWeight: '500' },
  fab: {
    position: 'absolute', bottom: 24, right: 20, width: 52, height: 52,
    borderRadius: 26, backgroundColor: mobileTheme.colors.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: mobileTheme.colors.shadow, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 5,
  },
  fabText: { fontSize: 26, color: mobileTheme.colors.onPrimary, lineHeight: 30 },
})
