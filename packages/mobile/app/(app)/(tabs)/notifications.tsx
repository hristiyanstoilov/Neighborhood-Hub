import { useCallback, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { apiFetch } from '../../../lib/api'

interface NotificationItem {
  id: string
  type: string
  entityType: string
  entityId: string | null
  isRead: boolean
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  new_request:       'New skill request received',
  request_accepted:  'Your request was accepted',
  request_rejected:  'Your request was rejected',
  request_cancelled: 'A request was cancelled',
  request_completed: 'A session was marked complete',
}

const TYPE_ICONS: Record<string, string> = {
  new_request:       '📥',
  request_accepted:  '✅',
  request_rejected:  '❌',
  request_cancelled: '🚫',
  request_completed: '🎉',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function NotificationsScreen() {
  const router = useRouter()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiFetch('/api/notifications')
      if (!res.ok) return
      const json = await res.json()
      setItems(json.data ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => {
    setLoading(true)
    fetchNotifications()
  }, [fetchNotifications]))

  async function handleRefresh() {
    setRefreshing(true)
    await fetchNotifications()
    setRefreshing(false)
  }

  async function handlePress(item: NotificationItem) {
    setActionLoading(true)
    // Optimistic remove
    setItems((prev) => prev.filter((n) => n.id !== item.id))
    await apiFetch('/api/notifications/read', {
      method: 'PATCH',
      body: JSON.stringify({ id: item.id }),
    }).catch(() => {})
    setActionLoading(false)
    if (item.entityType === 'skill_request') {
      router.push('/(app)/(tabs)/my-requests')
    }
  }

  async function handleMarkAllRead() {
    setItems([])
    await apiFetch('/api/notifications/read', { method: 'PATCH' }).catch(() => {})
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#15803d" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptySubtitle}>No new notifications.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => handlePress(item)}
            disabled={actionLoading}
          >
            <Text style={styles.itemIcon}>{TYPE_ICONS[item.type] ?? '🔔'}</Text>
            <View style={styles.itemBody}>
              <Text style={styles.itemLabel}>{TYPE_LABELS[item.type] ?? 'New notification'}</Text>
              <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <Text style={styles.itemChevron}>›</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  markAllText: { fontSize: 13, color: '#15803d', fontWeight: '500' },
  list: { paddingBottom: 24 },
  emptyContainer: { flex: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  itemIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  itemBody: { flex: 1 },
  itemLabel: { fontSize: 14, fontWeight: '500', color: '#111827', lineHeight: 20 },
  itemDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  itemChevron: { fontSize: 20, color: '#d1d5db' },
  separator: { height: 1, backgroundColor: '#f3f4f6' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubtitle: { fontSize: 13, color: '#9ca3af' },
})