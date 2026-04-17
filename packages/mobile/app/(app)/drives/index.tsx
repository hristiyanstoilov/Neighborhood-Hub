import { useCallback, useState } from 'react'
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
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import { fetchDrivesList, drivesKeys, type DriveListItem } from '../../../lib/queries/drives'
import { formatDateOnly } from '../../../lib/format'

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
  open:      { bg: '#d1fae5', text: '#065f46' },
  completed: { bg: '#dbeafe', text: '#1e40af' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
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
  const [status, setStatus]       = useState('open')
  const [driveType, setDriveType] = useState<string | null>(null)

  const drivesQuery = useQuery({
    queryKey: drivesKeys.list(status, driveType, 1),
    queryFn:  () => fetchDrivesList({ status, driveType, page: 1, limit: 30 }),
    staleTime: 60_000,
  })

  useFocusEffect(
    useCallback(() => {
      if (drivesQuery.isLoading) return
      void drivesQuery.refetch()
    }, [drivesQuery.isLoading, drivesQuery.refetch, status, driveType])
  )

  const drives    = drivesQuery.data?.data ?? []
  const isLoading = drivesQuery.isFetching && !drivesQuery.data
  const isRefreshing = drivesQuery.isFetching && !!drivesQuery.data

  function renderDrive({ item }: { item: DriveListItem }) {
    const sc = STATUS_COLORS[item.status] ?? { bg: '#f3f4f6', text: '#6b7280' }
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
    <View style={styles.container}>
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
              onPress={() => setStatus(tab.key)}
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
              onPress={() => setDriveType(chip.key)}
            >
              <Text style={[styles.chipSmallText, driveType === chip.key && styles.chipSmallTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#15803d" />
        </View>
      ) : drivesQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load drives.</Text>
          <TouchableOpacity onPress={() => void drivesQuery.refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={drives}
          keyExtractor={(item) => item.id}
          renderItem={renderDrive}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void drivesQuery.refetch()}
              tintColor="#15803d"
            />
          }
          contentContainerStyle={drives.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No drives here yet.</Text>
              {user && (
                <TouchableOpacity onPress={() => router.push('/(app)/drives/new')}>
                  <Text style={styles.emptyLink}>Start the first one →</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {user && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(app)/drives/new')}
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
  title:         { fontSize: 20, fontWeight: '700', color: '#111827' },
  createBtn:     { backgroundColor: '#15803d', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  createBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  filterRow:     { paddingBottom: 6 },
  filterScroll:  { paddingHorizontal: 16, gap: 6 },
  chip:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  chipActive:    { backgroundColor: '#15803d', borderColor: '#15803d' },
  chipText:      { fontSize: 13, color: '#374151' },
  chipTextActive:{ color: '#fff', fontWeight: '600' },
  chipSmall:     { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  chipSmallActive:     { backgroundColor: '#111827', borderColor: '#111827' },
  chipSmallText:       { fontSize: 12, color: '#6b7280' },
  chipSmallTextActive: { color: '#fff', fontWeight: '600' },
  list:          { paddingBottom: 100 },
  emptyContainer:{ flex: 1 },
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
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  cardTitle:  { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  badge:      { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:  { fontSize: 11, fontWeight: '500' },
  cardDesc:   { fontSize: 13, color: '#4b5563', marginBottom: 4 },
  goalText:   { fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginBottom: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cardFooterRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  organizer:  { fontSize: 12, color: '#9ca3af' },
  deadline:   { fontSize: 11, color: '#9ca3af' },
  statusBadge:{ borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '600' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  errorText:  { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  emptyText:  { fontSize: 15, color: '#9ca3af' },
  emptyLink:  { fontSize: 13, color: '#15803d', fontWeight: '500' },
  retryBtn:   { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 8, backgroundColor: '#15803d' },
  retryText:  { color: '#fff', fontSize: 14, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 20, width: 52, height: 52,
    borderRadius: 26, backgroundColor: '#15803d', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 5,
  },
  fabText: { fontSize: 26, color: '#fff', lineHeight: 30 },
})
