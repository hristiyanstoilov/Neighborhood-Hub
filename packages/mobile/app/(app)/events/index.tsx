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
import { fetchEventsList, eventsKeys, type EventListItem } from '../../../lib/queries/events'
import { formatDateTime } from '../../../lib/format'

const PAGE_SIZE = 20

const STATUS_TABS = [
  { key: 'published', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  published: { bg: mobileTheme.colors.statusSuccessBg, text: mobileTheme.colors.statusSuccessText },
  completed: { bg: mobileTheme.colors.statusInfoBg, text: mobileTheme.colors.statusInfoText },
  cancelled: { bg: mobileTheme.colors.statusDangerBg, text: mobileTheme.colors.statusDangerText },
}

export default function EventsListScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState('published')

  const eventsQuery = useInfiniteQuery({
    queryKey:        eventsKeys.list(status),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchEventsList({ status, page: pageParam, limit: PAGE_SIZE }),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, p) => sum + p.data.length, 0)
      return loaded < lastPage.total ? pages.length + 1 : undefined
    },
    staleTime: 60_000,
  })

  // Use a ref so isFetching doesn't become a useCallback dep (would cause infinite refetch loop)
  const isFetchingRef = useRef(eventsQuery.isFetching)
  isFetchingRef.current = eventsQuery.isFetching

  useFocusEffect(
    useCallback(() => {
      if (isFetchingRef.current) return
      void eventsQuery.refetch()
    }, [eventsQuery.refetch, status])
  )

  const events = useMemo(
    () => eventsQuery.data?.pages.flatMap((p) => p.data) ?? [],
    [eventsQuery.data]
  )
  const total       = eventsQuery.data?.pages[0]?.total ?? 0
  const isInitial   = eventsQuery.isFetching && !eventsQuery.data
  const isRefreshing = eventsQuery.isRefetching && !!eventsQuery.data
  const hasMore     = events.length < total

  function handleStatusChange(newStatus: string) {
    if (newStatus === status) return
    setStatus(newStatus)
  }

  function renderEvent({ item }: { item: EventListItem }) {
    const sc = STATUS_COLORS[item.status] ?? { bg: mobileTheme.colors.canvas, text: mobileTheme.colors.textMuted }
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/events/${item.id}`)}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.badgeText, { color: sc.text }]}>
              {item.status === 'published' ? 'Upcoming' : item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.dateText}>{formatDateTime(item.startsAt)}</Text>
        {(item.locationNeighborhood || item.address) && (
          <Text style={styles.locationText} numberOfLines={1}>
            📍 {item.locationNeighborhood
              ? `${item.locationNeighborhood}, ${item.locationCity}`
              : item.address}
          </Text>
        )}
        <Text style={styles.organizer}>by {item.organizerName ?? 'Anonymous'}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <AppScreen backgroundColor={mobileTheme.colors.canvasAlt}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        {user && (
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/(app)/events/new')}
          >
            <Text style={styles.createBtnText}>+ Create</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter chips */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.chip, status === tab.key && styles.chipActive]}
              onPress={() => handleStatusChange(tab.key)}
            >
              <Text style={[styles.chipText, status === tab.key && styles.chipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <PagedListView
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        loading={isInitial}
        error={eventsQuery.isError}
        errorMessage="Could not load events."
        onRetry={() => void eventsQuery.refetch()}
        refreshing={isRefreshing}
        onRefresh={() => void eventsQuery.refetch()}
        onEndReached={() => void eventsQuery.fetchNextPage()}
        hasMore={hasMore}
        loadingMore={eventsQuery.isFetchingNextPage}
        listContentStyle={styles.list}
        emptyMessage="No events yet."
        emptyAction={
          user ? (
            <TouchableOpacity onPress={() => router.push('/(app)/events/new')}>
              <Text style={styles.emptyLink}>Be the first to create one →</Text>
            </TouchableOpacity>
          ) : null
        }
        footer={
          <TouchableOpacity
            style={styles.loadMoreBtn}
            onPress={() => void eventsQuery.fetchNextPage()}
            disabled={eventsQuery.isFetchingNextPage}
          >
            {eventsQuery.isFetchingNextPage
              ? <ActivityIndicator color={mobileTheme.colors.primary} />
              : <Text style={styles.loadMoreText}>Load more</Text>
            }
          </TouchableOpacity>
        }
      />

      {/* FAB */}
      {user && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(app)/events/new')}
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
  title: { fontSize: 20, fontWeight: '700', color: mobileTheme.colors.textPrimary },
  createBtn: {
    backgroundColor: mobileTheme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createBtnText: { color: mobileTheme.colors.onPrimary, fontSize: 13, fontWeight: '600' },
  filterRow: { paddingBottom: 8 },
  filterScroll: { paddingHorizontal: 16, gap: 6 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surface,
  },
  chipActive: { backgroundColor: mobileTheme.colors.primary, borderColor: mobileTheme.colors.primary },
  chipText: { fontSize: 13, color: mobileTheme.colors.textSecondary },
  chipTextActive: { color: mobileTheme.colors.onPrimary, fontWeight: '600' },
  list: { paddingBottom: 100 },
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: mobileTheme.colors.textPrimary },
  badge: { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  dateText: { fontSize: 13, color: mobileTheme.colors.primary, fontWeight: '500', marginBottom: 3 },
  locationText: { fontSize: 12, color: mobileTheme.colors.textMuted, marginBottom: 3 },
  organizer: { fontSize: 12, color: mobileTheme.colors.textSubtle },
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
  emptyLink: { fontSize: 13, color: mobileTheme.colors.primary, fontWeight: '500' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: mobileTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: mobileTheme.colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  fabText: { fontSize: 26, color: mobileTheme.colors.onPrimary, lineHeight: 30 },
})
