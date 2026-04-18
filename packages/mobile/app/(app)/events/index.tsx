import { useCallback, useMemo, useState } from 'react'
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
import { fetchEventsList, eventsKeys, type EventListItem } from '../../../lib/queries/events'
import { formatDateTime } from '../../../lib/format'

const PAGE_SIZE = 20

const STATUS_TABS = [
  { key: 'published', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  published: { bg: '#d1fae5', text: '#065f46' },
  completed: { bg: '#dbeafe', text: '#1e40af' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
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

  useFocusEffect(
    useCallback(() => {
      if (eventsQuery.isFetching) return
      void eventsQuery.refetch()
    }, [eventsQuery.isFetching, eventsQuery.refetch, status])
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
    const sc = STATUS_COLORS[item.status] ?? { bg: '#f3f4f6', text: '#6b7280' }
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
    <View style={styles.container}>
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

      {isInitial ? (
        <View style={styles.center}>
          <ActivityIndicator color="#15803d" />
        </View>
      ) : eventsQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load events.</Text>
          <TouchableOpacity onPress={() => void eventsQuery.refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void eventsQuery.refetch()}
              tintColor="#15803d"
            />
          }
          contentContainerStyle={events.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No events yet.</Text>
              {user && (
                <TouchableOpacity onPress={() => router.push('/(app)/events/new')}>
                  <Text style={styles.emptyLink}>Be the first to create one →</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => void eventsQuery.fetchNextPage()}
                disabled={eventsQuery.isFetchingNextPage}
              >
                {eventsQuery.isFetchingNextPage
                  ? <ActivityIndicator color="#15803d" />
                  : <Text style={styles.loadMoreText}>Load more</Text>
                }
              </TouchableOpacity>
            ) : null
          }
        />
      )}

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
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  createBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  filterRow: { paddingBottom: 8 },
  filterScroll: { paddingHorizontal: 16, gap: 6 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#15803d', borderColor: '#15803d' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingBottom: 100 },
  emptyContainer: { flex: 1 },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  badge: { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  dateText: { fontSize: 13, color: '#15803d', fontWeight: '500', marginBottom: 3 },
  locationText: { fontSize: 12, color: '#6b7280', marginBottom: 3 },
  organizer: { fontSize: 12, color: '#9ca3af' },
  loadMoreBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  loadMoreText: { color: '#15803d', fontWeight: '500', fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  errorText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  emptyText: { fontSize: 15, color: '#9ca3af' },
  emptyLink: { fontSize: 13, color: '#15803d', fontWeight: '500' },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#15803d',
  },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#15803d',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  fabText: { fontSize: 26, color: '#fff', lineHeight: 30 },
})
