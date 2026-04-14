import { useCallback } from 'react'
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import {
  fetchNotifications,
  markNotificationRead,
  notificationsKeys,
  type NotificationItem,
} from '../../../lib/queries/notifications'
import { formatDateTime } from '../../../lib/format'

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

export default function NotificationsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const notificationsQuery = useQuery({
    queryKey: notificationsKeys.list(),
    queryFn: fetchNotifications,
    enabled: Boolean(user),
  })

  const markReadMutation = useMutation({
    mutationFn: (id?: string) => markNotificationRead(id),
    onMutate: async (id?: string) => {
      await queryClient.cancelQueries({ queryKey: notificationsKeys.list() })
      const previous = queryClient.getQueryData<NotificationItem[]>(notificationsKeys.list()) ?? []

      queryClient.setQueryData<NotificationItem[]>(notificationsKeys.list(), (current = []) =>
        typeof id === 'string' ? current.filter((item) => item.id !== id) : []
      )

      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationsKeys.list(), context.previous)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsKeys.all })
    },
  })

  useFocusEffect(
    useCallback(() => {
      if (!user) return
      if (notificationsQuery.isLoading) return
      void notificationsQuery.refetch()
    }, [notificationsQuery.isLoading, notificationsQuery.refetch, user])
  )

  const items = notificationsQuery.data ?? []
  const loading = notificationsQuery.isLoading
  const refreshing = notificationsQuery.isFetching && !notificationsQuery.isLoading

  async function handleRefresh() {
    await notificationsQuery.refetch()
  }

  async function handlePress(item: NotificationItem) {
    await markReadMutation.mutateAsync(item.id).catch(() => {})
    if (item.entityType === 'skill_request') {
      router.push('/(app)/(tabs)/my-requests')
    }
  }

  async function handleMarkAllRead() {
    await markReadMutation.mutateAsync(undefined).catch(() => {})
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    )
  }


  if (notificationsQuery.isError && !notificationsQuery.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load notifications.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => void notificationsQuery.refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
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
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor="#15803d" />
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
            disabled={markReadMutation.isPending}
          >
            <Text style={styles.itemIcon}>{TYPE_ICONS[item.type] ?? '🔔'}</Text>
            <View style={styles.itemBody}>
              <Text style={styles.itemLabel}>{TYPE_LABELS[item.type] ?? 'New notification'}</Text>
              <Text style={styles.itemDate}>{formatDateTime(item.createdAt)}</Text>
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
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#15803d',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
})