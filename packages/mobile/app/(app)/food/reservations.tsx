import { useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import { fetchFoodReservationsForUser, foodKeys, type FoodReservationWithShare } from '../../../lib/queries/food'
import { formatDateTime } from '../../../lib/format'

const ROLE_TABS: Array<{ key: 'requester' | 'owner'; label: string }> = [
  { key: 'requester', label: 'My reservations' },
  { key: 'owner', label: 'For my food' },
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#fef3c7', text: '#92400e' },
  reserved: { bg: '#d1fae5', text: '#065f46' },
  picked_up: { bg: '#dbeafe', text: '#1e40af' },
  rejected: { bg: '#fee2e2', text: '#991b1b' },
  cancelled: { bg: '#f3f4f6', text: '#6b7280' },
}

export default function FoodReservationsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [role, setRole] = useState<'requester' | 'owner'>('requester')

  const reservationsQuery = useQuery<FoodReservationWithShare[]>({
    queryKey: foodKeys.userReservations(role),
    queryFn: () => fetchFoodReservationsForUser(role),
    enabled: Boolean(user),
    staleTime: 30_000,
  })

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Log in to view your food reservations.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.primaryBtnText}>Log in</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (reservationsQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#15803d" />
      </View>
    )
  }

  if (reservationsQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Could not load reservations.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => void reservationsQuery.refetch()}>
          <Text style={styles.primaryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const rows = reservationsQuery.data ?? []

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {ROLE_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, role === tab.key && styles.tabBtnActive]}
            onPress={() => setRole(tab.key)}
          >
            <Text style={[styles.tabLabel, role === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={rows.length === 0 ? styles.emptyListContainer : styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={reservationsQuery.isRefetching}
            onRefresh={() => void reservationsQuery.refetch()}
            tintColor="#15803d"
          />
        }
        renderItem={({ item }) => <ReservationCard item={item} onOpenFood={() => router.push(`/(app)/food/${item.foodShareId}`)} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              {role === 'requester' ? "You haven't reserved food yet." : 'No reservations for your food yet.'}
            </Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(app)/food')}>
              <Text style={styles.secondaryBtnText}>Browse food</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  )
}

function ReservationCard({ item, onOpenFood }: { item: FoodReservationWithShare; onOpenFood: () => void }) {
  const sc = STATUS_COLORS[item.status] ?? { bg: '#f3f4f6', text: '#6b7280' }

  return (
    <TouchableOpacity style={styles.card} onPress={onOpenFood} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.foodShareTitle}</Text>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.badgeText, { color: sc.text }]}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <Text style={styles.metaText}>Pickup: {formatDateTime(item.pickupAt)}</Text>
      {item.requesterName ? <Text style={styles.metaSubtle}>Requester: {item.requesterName}</Text> : null}
      {item.notes ? <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text> : null}
      {item.cancellationReason ? <Text style={styles.cancelled}>Cancelled: {item.cancellationReason}</Text> : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  tabBtn: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff', paddingVertical: 10, alignItems: 'center' },
  tabBtnActive: { borderColor: '#15803d', backgroundColor: '#f0fdf4' },
  tabLabel: { color: '#4b5563', fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: '#166534' },
  listContainer: { padding: 16, gap: 10, paddingBottom: 30 },
  emptyListContainer: { flexGrow: 1 },
  card: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', padding: 12, gap: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  metaText: { fontSize: 12, color: '#374151' },
  metaSubtle: { fontSize: 12, color: '#6b7280' },
  notes: { fontSize: 12, color: '#4b5563' },
  cancelled: { fontSize: 12, color: '#b91c1c' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center' },
  primaryBtn: { backgroundColor: '#15803d', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  secondaryBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' },
  secondaryBtnText: { color: '#374151', fontSize: 14, fontWeight: '600' },
})
