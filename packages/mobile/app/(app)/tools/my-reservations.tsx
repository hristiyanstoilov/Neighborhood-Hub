import { useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import { fetchUserToolReservations, toolsKeys, type UserReservationItem } from '../../../lib/queries/tools'

type Role = 'borrower' | 'owner'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#fef9c3', text: '#854d0e' },
  approved:  { bg: '#d1fae5', text: '#065f46' },
  returned:  { bg: '#dbeafe', text: '#1e40af' },
  rejected:  { bg: '#fee2e2', text: '#991b1b' },
  cancelled: { bg: '#f3f4f6', text: '#6b7280' },
}

export default function MyToolReservationsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [role, setRole] = useState<Role>('borrower')
  const [refreshing, setRefreshing] = useState(false)

  const reservationsQuery = useQuery<UserReservationItem[]>({
    queryKey: toolsKeys.myReservations(role),
    queryFn: () => fetchUserToolReservations(role),
    enabled: Boolean(user),
    staleTime: 30_000,
  })

  async function handleRefresh() {
    setRefreshing(true)
    await reservationsQuery.refetch()
    setRefreshing(false)
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Log in to view your tool reservations.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.primaryBtnText}>Log in</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const rows = reservationsQuery.data ?? []

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>My Reservations</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/tools')}>
          <Text style={styles.browseLink}>Browse →</Text>
        </TouchableOpacity>
      </View>

      {/* Role tabs */}
      <View style={styles.tabs}>
        {(['borrower', 'owner'] as Role[]).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.tab, role === r && styles.tabActive]}
            onPress={() => setRole(r)}
          >
            <Text style={[styles.tabText, role === r && styles.tabTextActive]}>
              {r === 'borrower' ? 'Borrowed' : 'Lent out'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {reservationsQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#15803d" />
        </View>
      ) : reservationsQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Could not load reservations.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => void reservationsQuery.refetch()}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={rows.length === 0 ? styles.emptyListContainer : styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor="#15803d" />
          }
          renderItem={({ item }) => (
            <ReservationCard item={item} onOpen={() => router.push(`/(app)/tools/${item.toolId}`)} />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {role === 'borrower' ? "You haven't borrowed any tools yet." : "Nobody has reserved your tools yet."}
              </Text>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(app)/tools')}>
                <Text style={styles.secondaryBtnText}>Browse tools</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  )
}

function ReservationCard({ item, onOpen }: { item: UserReservationItem; onOpen: () => void }) {
  const color = STATUS_COLORS[item.status] ?? { bg: '#f3f4f6', text: '#6b7280' }
  // Dates are plain date strings (YYYY-MM-DD) — avoid UTC-to-local shift by splitting directly
  const fmt = (d: string) => d.split('T')[0].split('-').reverse().join('/')
  const start = fmt(item.startDate)
  const end = fmt(item.endDate)

  return (
    <TouchableOpacity style={styles.card} onPress={onOpen} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.toolTitle ?? 'Tool'}</Text>
        <View style={[styles.badge, { backgroundColor: color.bg }]}>
          <Text style={[styles.badgeText, { color: color.text }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.metaText}>{start} – {end}</Text>
      {item.notes ? <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text> : null}
      {item.cancellationReason ? <Text style={styles.notes} numberOfLines={1}>Reason: {item.cancellationReason}</Text> : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  header: { fontSize: 20, fontWeight: '700', color: '#111827' },
  browseLink: { color: '#15803d', fontSize: 14, fontWeight: '600' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: '#fff' },
  tabActive: { backgroundColor: '#15803d' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  tabTextActive: { color: '#fff' },
  listContainer: { padding: 16, gap: 10, paddingBottom: 30 },
  emptyListContainer: { flexGrow: 1 },
  card: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', padding: 12, gap: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  metaText: { fontSize: 12, color: '#374151' },
  notes: { fontSize: 12, color: '#6b7280' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center' },
  primaryBtn: { backgroundColor: '#15803d', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  secondaryBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' },
  secondaryBtnText: { color: '#374151', fontSize: 14, fontWeight: '600' },
})
