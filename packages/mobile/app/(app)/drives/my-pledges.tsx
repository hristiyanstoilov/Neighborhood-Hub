import { useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import { fetchUserPledges, drivesKeys, type UserPledgeItem } from '../../../lib/queries/drives'

const PLEDGE_COLORS: Record<string, { bg: string; text: string }> = {
  pledged: { bg: '#d1fae5', text: '#065f46' },
  fulfilled: { bg: '#dbeafe', text: '#1e40af' },
  cancelled: { bg: '#f3f4f6', text: '#6b7280' },
}

const DRIVE_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: '#d1fae5', text: '#065f46' },
  completed: { bg: '#dbeafe', text: '#1e40af' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
}

export default function MyPledgesScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [refreshing, setRefreshing] = useState(false)

  const pledgesQuery = useQuery<UserPledgeItem[]>({
    queryKey: drivesKeys.myPledges(),
    queryFn: fetchUserPledges,
    enabled: Boolean(user),
    staleTime: 30_000,
  })

  async function handleRefresh() {
    setRefreshing(true)
    await pledgesQuery.refetch()
    setRefreshing(false)
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Log in to view your drive pledges.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.primaryBtnText}>Log in</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (pledgesQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#15803d" />
      </View>
    )
  }

  if (pledgesQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Could not load pledges.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => void pledgesQuery.refetch()}>
          <Text style={styles.primaryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const rows = pledgesQuery.data ?? []

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>My Pledges</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/drives')}>
          <Text style={styles.browseLink}>Browse →</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.pledgeId}
        contentContainerStyle={rows.length === 0 ? styles.emptyListContainer : styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor="#15803d" />
        }
        renderItem={({ item }) => <PledgeCard item={item} onOpenDrive={() => router.push(`/(app)/drives/${item.driveId}`)} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>You haven't pledged to any drives yet.</Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(app)/drives')}>
              <Text style={styles.secondaryBtnText}>Browse drives</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  )
}

function PledgeCard({ item, onOpenDrive }: { item: UserPledgeItem; onOpenDrive: () => void }) {
  const pledgeColor = PLEDGE_COLORS[item.pledgeStatus] ?? { bg: '#f3f4f6', text: '#6b7280' }
  const driveColor = DRIVE_COLORS[item.driveStatus] ?? { bg: '#f3f4f6', text: '#6b7280' }
  const deadlineText = item.deadline ? ` · Deadline: ${new Date(item.deadline).toLocaleDateString('en-GB')}` : ''

  return (
    <TouchableOpacity style={styles.card} onPress={onOpenDrive} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.driveTitle}</Text>
      </View>

      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: pledgeColor.bg }]}>
          <Text style={[styles.badgeText, { color: pledgeColor.text }]}>{item.pledgeStatus.replace('_', ' ')}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: driveColor.bg }]}>
          <Text style={[styles.badgeText, { color: driveColor.text }]}>{item.driveStatus.replace('_', ' ')}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>{item.pledgeDescription}</Text>
      <Text style={styles.metaText}>{item.organizerName ? `By ${item.organizerName}` : 'By —'}{deadlineText}</Text>
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
  description: { fontSize: 13, color: '#374151' },
  metaText: { fontSize: 12, color: '#6b7280' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center' },
  primaryBtn: { backgroundColor: '#15803d', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  secondaryBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' },
  secondaryBtnText: { color: '#374151', fontSize: 14, fontWeight: '600' },
})