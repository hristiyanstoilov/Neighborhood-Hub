import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import { apiFetch } from '../../../lib/api'
import { fetchEventDetail, eventsKeys } from '../../../lib/queries/events'
import { formatDateTime } from '../../../lib/format'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  published: { bg: '#d1fae5', text: '#065f46' },
  completed: { bg: '#dbeafe', text: '#1e40af' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  // We track rsvp state locally so UI updates immediately without refetch
  const [rsvpStatus, setRsvpStatus] = useState<'attending' | 'cancelled' | null>(null)

  const eventQuery = useQuery({
    queryKey: eventsKeys.detail(id ?? ''),
    queryFn:  () => fetchEventDetail(id as string),
    enabled:  Boolean(id),
    staleTime: 30_000,
  })

  const rsvpMutation = useMutation({
    mutationFn: async (action: 'attend' | 'cancel') => {
      const res = await apiFetch(`/api/events/${id}/rsvp`, {
        method: action === 'attend' ? 'POST' : 'DELETE',
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      return action
    },
    onSuccess: (action) => {
      setRsvpStatus(action === 'attend' ? 'attending' : 'cancelled')
      void queryClient.invalidateQueries({ queryKey: eventsKeys.detail(id ?? '') })
    },
  })

  const event = eventQuery.data

  // Initialize rsvpStatus from attendeeCount context — we don't have a /my-rsvp endpoint,
  // so we can only know after the user acts. Start as null (unknown).
  // The button shows "RSVP" when null/cancelled, "Cancel RSVP" when attending.

  if (eventQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#15803d" size="large" />
      </View>
    )
  }

  if (eventQuery.isError || !event) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load this event.</Text>
        <TouchableOpacity onPress={() => void eventQuery.refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const sc = STATUS_COLORS[event.status] ?? { bg: '#f3f4f6', text: '#6b7280' }
  const isOrganizer = user?.id === event.organizerId
  const isOpen = event.status === 'published'

  function handleRsvp() {
    if (!user) {
      Alert.alert('Login required', 'Please log in to RSVP for this event.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log in', onPress: () => router.push('/(auth)/login') },
      ])
      return
    }

    const action = rsvpStatus === 'attending' ? 'cancel' : 'attend'

    rsvpMutation.mutate(action, {
      onError: (err) => {
        const msg: Record<string, string> = {
          EVENT_FULL:     'This event is full.',
          EVENT_NOT_OPEN: 'This event is no longer accepting RSVPs.',
          TOO_MANY_REQUESTS: 'Too many attempts. Please wait.',
        }
        Alert.alert('RSVP failed', msg[err.message] ?? 'Something went wrong.')
      },
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Title + status */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{event.title}</Text>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.badgeText, { color: sc.text }]}>
            {event.status === 'published' ? 'Upcoming' : event.status}
          </Text>
        </View>
      </View>

      {event.description ? (
        <Text style={styles.description}>{event.description}</Text>
      ) : null}

      {/* Details */}
      <View style={styles.detailsBox}>
        <DetailRow label="Starts" value={formatDateTime(event.startsAt)} />
        {event.endsAt && <DetailRow label="Ends" value={formatDateTime(event.endsAt)} />}
        {(event.locationNeighborhood || event.address) && (
          <DetailRow
            label="Location"
            value={event.locationNeighborhood
              ? `${event.locationNeighborhood}, ${event.locationCity}`
              : event.address!}
          />
        )}
        <DetailRow label="Organised by" value={event.organizerName ?? 'Anonymous'} />
        <DetailRow
          label="Attendees"
          value={event.maxCapacity
            ? `${event.attendeeCount} / ${event.maxCapacity}`
            : String(event.attendeeCount)}
        />
      </View>

      {/* RSVP action */}
      {isOrganizer ? (
        <Text style={styles.organizerNote}>You are the organiser of this event.</Text>
      ) : !isOpen ? (
        <Text style={styles.closedNote}>
          {event.status === 'cancelled' ? 'This event has been cancelled.' : 'This event has already taken place.'}
        </Text>
      ) : (
        <View style={styles.rsvpSection}>
          {rsvpStatus === 'attending' && (
            <Text style={styles.attendingNote}>✓ You are attending this event</Text>
          )}
          <TouchableOpacity
            style={[
              styles.rsvpBtn,
              rsvpStatus === 'attending' && styles.rsvpBtnCancel,
              rsvpMutation.isPending && styles.rsvpBtnDisabled,
            ]}
            onPress={handleRsvp}
            disabled={rsvpMutation.isPending}
          >
            {rsvpMutation.isPending ? (
              <ActivityIndicator color={rsvpStatus === 'attending' ? '#15803d' : '#fff'} size="small" />
            ) : (
              <Text style={[styles.rsvpBtnText, rsvpStatus === 'attending' && styles.rsvpBtnCancelText]}>
                {rsvpStatus === 'attending' ? 'Cancel my RSVP' : 'RSVP to this event'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#f9fafb' },
  content:    { padding: 16, gap: 16, paddingBottom: 40 },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  titleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  title:      { flex: 1, fontSize: 20, fontWeight: '700', color: '#111827', lineHeight: 26 },
  badge:      { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText:  { fontSize: 12, fontWeight: '600' },
  description: { fontSize: 14, color: '#4b5563', lineHeight: 22 },
  detailsBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  detailRow:  { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  detailLabel:{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.4, flex: 1 },
  detailValue:{ fontSize: 13, color: '#111827', fontWeight: '500', flex: 2, textAlign: 'right' },
  rsvpSection:{ gap: 8 },
  attendingNote: { fontSize: 14, color: '#15803d', fontWeight: '600', textAlign: 'center' },
  organizerNote: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 8 },
  closedNote:    { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 8 },
  rsvpBtn: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rsvpBtnCancel:     { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db' },
  rsvpBtnDisabled:   { opacity: 0.6 },
  rsvpBtnText:       { fontSize: 15, fontWeight: '600', color: '#fff' },
  rsvpBtnCancelText: { color: '#374151' },
  errorText:  { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  retryBtn:   { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 8, backgroundColor: '#15803d' },
  retryText:  { color: '#fff', fontSize: 14, fontWeight: '600' },
})
