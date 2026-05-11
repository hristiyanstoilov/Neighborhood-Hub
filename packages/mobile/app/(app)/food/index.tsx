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
import { fetchFoodList, foodKeys, type FoodShareListItem } from '../../../lib/queries/food'

const PAGE_SIZE = 20

const STATUS_TABS = [
  { key: 'available', label: 'Available' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'picked_up', label: 'Picked up' },
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  available: { bg: '#d1fae5', text: '#065f46' },
  reserved: { bg: '#fef3c7', text: '#92400e' },
  picked_up: { bg: '#e5e7eb', text: '#374151' },
}

function getStatusLabel(item: { status: string; remainingQuantity?: number }) {
  if (item.status === 'available' && typeof item.remainingQuantity === 'number') {
    return item.remainingQuantity === 1 ? 'available (1 left)' : `available (${item.remainingQuantity} left)`
  }
  return item.status.replace('_', ' ')
}

export default function FoodListScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState('available')

  const foodQuery = useInfiniteQuery({
    queryKey: foodKeys.list(status),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchFoodList({ status, page: pageParam, limit: PAGE_SIZE }),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, p) => sum + p.data.length, 0)
      return loaded < lastPage.total ? pages.length + 1 : undefined
    },
    staleTime: 60_000,
  })

  const isFetchingRef = useRef(foodQuery.isFetching)
  isFetchingRef.current = foodQuery.isFetching

  useFocusEffect(
    useCallback(() => {
      if (isFetchingRef.current) return
      void foodQuery.refetch()
    }, [foodQuery.refetch, status])
  )

  const foodShares = useMemo(() => foodQuery.data?.pages.flatMap((p) => p.data) ?? [], [foodQuery.data])
  const total = foodQuery.data?.pages[0]?.total ?? 0
  const isInitial = foodQuery.isFetching && !foodQuery.data
  const isRefreshing = foodQuery.isRefetching && !!foodQuery.data
  const hasMore = foodShares.length < total

  function renderFood({ item }: { item: FoodShareListItem }) {
    const sc = STATUS_COLORS[item.status] ?? { bg: '#f3f4f6', text: '#6b7280' }
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/(app)/food/${item.id}`)} activeOpacity={0.75}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: sc.bg }]}>
              <Text style={[styles.badgeText, { color: sc.text }]}>{getStatusLabel(item)}</Text>
          </View>
        </View>
        {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
        <Text style={styles.metaText}>Quantity: {item.quantity}</Text>
          <Text style={styles.metaSubtle}>Left: {item.remainingQuantity ?? item.quantity}</Text>
        {(item.locationNeighborhood || item.locationCity) && (
          <Text style={styles.locationText} numberOfLines={1}>📍 {item.locationNeighborhood ? `${item.locationNeighborhood}, ${item.locationCity}` : item.locationCity}</Text>
        )}
        <Text style={styles.organizer}>by {item.ownerName ?? 'Anonymous'}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Food Sharing</Text>
        {user && (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(app)/food/reservations')}>
              <Text style={styles.secondaryBtnText}>My reservations</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(app)/food/new')}>
              <Text style={styles.createBtnText}>+ Share</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_TABS.map((tab) => (
            <TouchableOpacity key={tab.key} style={[styles.chip, status === tab.key && styles.chipActive]} onPress={() => setStatus(tab.key)}>
              <Text style={[styles.chipText, status === tab.key && styles.chipTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isInitial ? (
        <View style={styles.center}><ActivityIndicator color="#15803d" /></View>
      ) : foodQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load food listings.</Text>
          <TouchableOpacity onPress={() => void foodQuery.refetch()} style={styles.retryBtn}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={foodShares}
          keyExtractor={(item) => item.id}
          renderItem={renderFood}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void foodQuery.refetch()} tintColor="#15803d" />}
          contentContainerStyle={foodShares.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No food listings yet.</Text>
              {user && (
                <TouchableOpacity onPress={() => router.push('/(app)/food/new')}>
                  <Text style={styles.emptyLink}>Be the first to share food →</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={() => void foodQuery.fetchNextPage()} disabled={foodQuery.isFetchingNextPage}>
                {foodQuery.isFetchingNextPage ? <ActivityIndicator color="#15803d" /> : <Text style={styles.loadMoreText}>Load more</Text>}
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {user && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/(app)/food/new')} activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secondaryBtn: { backgroundColor: '#fff', borderColor: '#d1d5db', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  secondaryBtnText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  createBtn: { backgroundColor: '#15803d', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  createBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  filterRow: { paddingBottom: 8 },
  filterScroll: { paddingHorizontal: 16, gap: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#15803d', borderColor: '#15803d' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingBottom: 100 },
  emptyContainer: { flex: 1 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 6, borderRadius: 10, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  badge: { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  cardDesc: { fontSize: 13, color: '#4b5563', marginBottom: 4 },
  metaText: { fontSize: 13, color: '#15803d', fontWeight: '500', marginBottom: 3 },
  metaSubtle: { fontSize: 12, color: '#6b7280', marginBottom: 3 },
  locationText: { fontSize: 12, color: '#6b7280', marginBottom: 3 },
  organizer: { fontSize: 12, color: '#9ca3af' },
  loadMoreBtn: { marginHorizontal: 16, marginTop: 8, marginBottom: 16, paddingVertical: 12, backgroundColor: '#f0fdf4', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  loadMoreText: { color: '#15803d', fontWeight: '500', fontSize: 14 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 52, height: 52, borderRadius: 26, backgroundColor: '#15803d', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 5 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '400' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  errorText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 8, backgroundColor: '#15803d' },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  emptyLink: { fontSize: 14, color: '#15803d', fontWeight: '500' },
})