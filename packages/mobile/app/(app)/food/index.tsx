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
import { fetchFoodList, foodKeys, type FoodShareListItem } from '../../../lib/queries/food'

const PAGE_SIZE = 20

const STATUS_TABS = [
  { key: 'available', label: 'Available' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'picked_up', label: 'Picked up' },
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  available: { bg: mobileTheme.colors.statusSuccessBg, text: mobileTheme.colors.statusSuccessText },
  reserved: { bg: mobileTheme.colors.statusWarningBg, text: mobileTheme.colors.statusWarningText },
  picked_up: { bg: mobileTheme.colors.borderSoft, text: mobileTheme.colors.textSecondary },
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
    const sc = STATUS_COLORS[item.status] ?? { bg: mobileTheme.colors.canvas, text: mobileTheme.colors.textMuted }
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
    <AppScreen backgroundColor={mobileTheme.colors.canvasAlt}>
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

      <PagedListView
        data={foodShares}
        keyExtractor={(item) => item.id}
        renderItem={renderFood}
        loading={isInitial}
        error={foodQuery.isError}
        errorMessage="Could not load food listings."
        onRetry={() => void foodQuery.refetch()}
        refreshing={isRefreshing}
        onRefresh={() => void foodQuery.refetch()}
        onEndReached={() => void foodQuery.fetchNextPage()}
        hasMore={hasMore}
        loadingMore={foodQuery.isFetchingNextPage}
        listContentStyle={styles.list}
        emptyMessage="No food listings yet."
        emptyAction={
          user ? (
            <TouchableOpacity onPress={() => router.push('/(app)/food/new')}>
              <Text style={styles.emptyLink}>Be the first to share food →</Text>
            </TouchableOpacity>
          ) : null
        }
        footer={
          <TouchableOpacity style={styles.loadMoreBtn} onPress={() => void foodQuery.fetchNextPage()} disabled={foodQuery.isFetchingNextPage}>
            {foodQuery.isFetchingNextPage
              ? <ActivityIndicator color={mobileTheme.colors.primary} />
              : <Text style={styles.loadMoreText}>Load more</Text>
            }
          </TouchableOpacity>
        }
      />

      {user && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/(app)/food/new')} activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: mobileTheme.colors.canvasAlt },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: '700', color: mobileTheme.colors.textPrimary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secondaryBtn: { backgroundColor: mobileTheme.colors.surface, borderColor: mobileTheme.colors.border, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  secondaryBtnText: { color: mobileTheme.colors.textSecondary, fontSize: 12, fontWeight: '600' },
  createBtn: { backgroundColor: mobileTheme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  createBtnText: { color: mobileTheme.colors.onPrimary, fontSize: 13, fontWeight: '600' },
  filterRow: { paddingBottom: 8 },
  filterScroll: { paddingHorizontal: 16, gap: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: mobileTheme.colors.border, backgroundColor: mobileTheme.colors.surface },
  chipActive: { backgroundColor: mobileTheme.colors.primary, borderColor: mobileTheme.colors.primary },
  chipText: { fontSize: 13, color: mobileTheme.colors.textSecondary },
  chipTextActive: { color: mobileTheme.colors.onPrimary, fontWeight: '600' },
  list: { paddingBottom: 100 },
  emptyContainer: { flex: 1 },
  card: { backgroundColor: mobileTheme.colors.surface, marginHorizontal: 16, marginVertical: 6, borderRadius: 10, padding: 14, shadowColor: mobileTheme.colors.shadow, shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: mobileTheme.colors.textPrimary },
  badge: { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  cardDesc: { fontSize: 13, color: '#4b5563', marginBottom: 4 },
  metaText: { fontSize: 13, color: mobileTheme.colors.primary, fontWeight: '500', marginBottom: 3 },
  metaSubtle: { fontSize: 12, color: mobileTheme.colors.textMuted, marginBottom: 3 },
  locationText: { fontSize: 12, color: mobileTheme.colors.textMuted, marginBottom: 3 },
  organizer: { fontSize: 12, color: mobileTheme.colors.textSubtle },
  loadMoreBtn: { marginHorizontal: 16, marginTop: 8, marginBottom: 16, paddingVertical: 12, backgroundColor: mobileTheme.colors.primarySoft, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: mobileTheme.colors.primarySoftBorder },
  loadMoreText: { color: mobileTheme.colors.primary, fontWeight: '500', fontSize: 14 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 52, height: 52, borderRadius: 26, backgroundColor: mobileTheme.colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: mobileTheme.colors.shadow, shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 5 },
  fabText: { color: mobileTheme.colors.onPrimary, fontSize: 28, lineHeight: 32, fontWeight: '400' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 8, backgroundColor: mobileTheme.colors.primary },
  retryText: { color: mobileTheme.colors.onPrimary, fontSize: 14, fontWeight: '600' },
  emptyLink: { fontSize: 14, color: mobileTheme.colors.primary, fontWeight: '500' },
})