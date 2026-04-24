import { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppScreen } from '../../../components/AppScreen'
import { PagedListView } from '../../../components/PagedListView'
import { useAuth } from '../../../contexts/auth'
import {
  fetchNotifications,
  markNotificationRead,
  notificationsKeys,
  type NotificationItem,
} from '../../../lib/queries/notifications'
import { formatDateTime } from '../../../lib/format'
import { mobileTheme } from '../../../lib/theme'

const TYPE_LABELS: Record<string, string> = {
  new_request:       'New skill request received',
  request_accepted:  'Your request was accepted',
  request_rejected:  'Your request was rejected',
  request_cancelled: 'A request was cancelled',
  request_completed: 'A session was marked complete',
  reservation_new: 'New tool reservation request',
  reservation_approved: 'Your tool reservation was approved',
  reservation_rejected: 'Your tool reservation was rejected',
  reservation_cancelled: 'A tool reservation was cancelled',
  reservation_returned: 'Tool marked as returned',
  food_reservation_new: 'New food reservation request',
  food_reservation_approved: 'Your food reservation was approved',
  food_reservation_rejected: 'Your food reservation was rejected',
  food_reservation_cancelled: 'A food reservation was cancelled',
  food_reservation_picked_up: 'Food was marked as picked up',
  event_new_rsvp: 'New RSVP for your event',
  event_cancelled: 'An event was cancelled',
  drive_new_pledge: 'New pledge for your drive',
  drive_pledge_fulfilled: 'A pledge was fulfilled',
  drive_completed: 'A drive was completed',
}

const TYPE_ICONS: Record<string, string> = {
  new_request:       '📥',
  request_accepted:  '✅',
  request_rejected:  '❌',
  request_cancelled: '🚫',
  request_completed: '🎉',
  reservation_new: '🧰',
  reservation_approved: '✅',
  reservation_rejected: '❌',
  reservation_cancelled: '🚫',
  reservation_returned: '↩️',
  food_reservation_new: '🍲',
  food_reservation_approved: '✅',
  food_reservation_rejected: '❌',
  food_reservation_cancelled: '🚫',
  food_reservation_picked_up: '🥡',
  event_new_rsvp: '📅',
  event_cancelled: '🚫',
  drive_new_pledge: '🫶',
  drive_pledge_fulfilled: '🎯',
  drive_completed: '🏁',
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  skill_request: 'Skill Request',
  tool_reservation: 'Tool Reservation',
  food_reservation: 'Food Reservation',
  drive_pledge: 'Drive Pledge',
  event_rsvp: 'Event RSVP',
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
  const isInitial = notificationsQuery.isLoading && !notificationsQuery.data
  const refreshing = notificationsQuery.isRefetching && !!notificationsQuery.data

  async function handleRefresh() {
    await notificationsQuery.refetch()
  }

  async function handlePress(item: NotificationItem) {
    await markReadMutation.mutateAsync(item.id).catch(() => {})
    if (item.entityType === 'skill_request') {
      router.push('/(app)/(tabs)/my-requests')
      return
    }

    if (item.entityType === 'food_reservation') {
      router.push('/(app)/food')
      return
    }

    if (item.entityType === 'tool_reservation') {
      router.push('/(app)/tools')
      return
    }

    if (item.entityType === 'drive_pledge' && item.entityId) {
      router.push(`/(app)/drives/${item.entityId}`)
      return
    }

    if (item.entityType === 'event_rsvp' && item.entityId) {
      router.push(`/(app)/events/${item.entityId}`)
      return
    }

    router.push('/(app)/(tabs)/index')
  }

  async function handleMarkAllRead() {
    await markReadMutation.mutateAsync(undefined).catch(() => {})
  }

  return (
    <AppScreen backgroundColor={mobileTheme.colors.canvasAlt}>
      <PagedListView
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => void handlePress(item)}
            disabled={markReadMutation.isPending}
          >
            <Text style={styles.itemIcon}>{TYPE_ICONS[item.type] ?? '🔔'}</Text>
            <View style={styles.itemBody}>
              <Text style={styles.itemLabel}>{TYPE_LABELS[item.type] ?? 'New notification'}</Text>
              <Text style={styles.itemEntity}>{ENTITY_TYPE_LABELS[item.entityType] ?? item.entityType}</Text>
              <Text style={styles.itemDate}>{formatDateTime(item.createdAt)}</Text>
            </View>
            <Text style={styles.itemChevron}>›</Text>
          </TouchableOpacity>
        )}
        loading={isInitial}
        error={notificationsQuery.isError}
        errorMessage="Could not load notifications."
        onRetry={() => void notificationsQuery.refetch()}
        refreshing={refreshing}
        onRefresh={() => void handleRefresh()}
        listHeader={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {items.length > 0 && (
              <TouchableOpacity onPress={() => void handleMarkAllRead()}>
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        listContentStyle={styles.list}
        emptyMessage=""
        emptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptySubtitle}>No new notifications.</Text>
          </View>
        }
        itemSeparator={<View style={styles.separator} />}
      />
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: mobileTheme.colors.textPrimary },
  markAllText: { fontSize: 13, color: mobileTheme.colors.primary, fontWeight: '500' },
  list: { paddingBottom: 24 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  itemIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  itemBody: { flex: 1 },
  itemLabel: { fontSize: 14, fontWeight: '500', color: mobileTheme.colors.textPrimary, lineHeight: 20 },
  itemEntity: { fontSize: 11, color: mobileTheme.colors.textMuted, marginTop: 2 },
  itemDate: { fontSize: 12, color: mobileTheme.colors.textSubtle, marginTop: 2 },
  itemChevron: { fontSize: 20, color: mobileTheme.colors.border },
  separator: { height: 1, backgroundColor: mobileTheme.colors.canvas },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: mobileTheme.colors.textSecondary },
  emptySubtitle: { fontSize: 13, color: mobileTheme.colors.textSubtle },
})