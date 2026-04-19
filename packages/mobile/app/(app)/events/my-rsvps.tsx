import { useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import { fetchUserRsvps, eventsKeys, type UserRsvpItem } from '../../../lib/queries/events'
import { RSVP_STATUS_COLORS, EVENT_STATUS_COLORS, EVENT_STATUS_LABELS, humanizeValue } from '../../../lib/format'

export default function MyRsvpsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [refreshing, setRefreshing] = useState(false)

  const rsvpsQuery = useQuery<UserRsvpItem[]>({
    queryKey: eventsKeys.myRsvps(),
    queryFn: fetchUserRsvps,
    enabled: Boolean(user),
    staleTime: 30_000,
  })

  async function handleRefresh() {
    setRefreshing(true)
    await rsvpsQuery.refetch()
    setRefreshing(false)
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Log in to view your event RSVPs.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.primaryBtnText}>Log in</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (rsvpsQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#15803d" />
      </View>
    )
  }

  if (rsvpsQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Could not load RSVPs.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => void rsvpsQuery.refetch()}>
          <Text style={styles.primaryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const rows = rsvpsQuery.data ?? []

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>My Events</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/events')}>
          <Text style={styles.browseLink}>Browse →</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.rsvpId}
        contentContainerStyle={rows.length === 0 ? styles.emptyListContainer : styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor="#15803d" />
        }
        renderItem={({ item }) => <RsvpCard item={item} onOpenEvent={() => router.push(`/(app)/events/${item.eventId}`)} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>You haven't RSVPed to any events yet.</Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(app)/events')}>
              <Text style={styles.secondaryBtnText}>Browse events</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  )
}

function RsvpCard({ item, onOpenEvent }: { item: UserRsvpItem; onOpenEvent: () => void }) {
  const rsvpColor = RSVP_STATUS_COLORS[item.rsvpStatus] ?? { bg: '#f3f4f6', text: '#6b7280' }
  const eventColor = EVENT_STATUS_COLORS[item.eventStatus] ?? { bg: '#f3f4f6', text: '#6b7280' }
  const dateText = new Date(item.eventStartsAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <TouchableOpacity style={styles.card} onPress={onOpenEvent} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.eventTitle}</Text>
      </View>

      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: rsvpColor.bg }]}>
          <Text style={[styles.badgeText, { color: rsvpColor.text }]}>{humanizeValue(item.rsvpStatus)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: eventColor.bg }]}>
          <Text style={[styles.badgeText, { color: eventColor.text }]}>{EVENT_STATUS_LABELS[item.eventStatus] ?? humanizeValue(item.eventStatus)}</Text>
        </View>
      </View>

      <Text style={styles.metaText}>{dateText}{item.locationNeighborhood ? ` · ${item.locationNeighborhood}` : ''}{item.eventAddress ? ` · ${item.eventAddress}` : ''}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  header: { fontSize: 20, fontWeight: '700', color: '#111827' },
  browseLink: { color: '#15803d', fontSize: 14, fontWeight: '600' },
  listContainer: { padding: 16, gap: 10, paddingBottom: 30 },
  emptyListContainer: { flexGrow: 1 },
  card: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', padding: 12, gap: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  metaText: { fontSize: 12, color: '#374151' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center' },
  primaryBtn: { backgroundColor: '#15803d', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  secondaryBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' },
  secondaryBtnText: { color: '#374151', fontSize: 14, fontWeight: '600' },
})