import { useMemo, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useAuth } from '../../../contexts/auth'
import { apiFetch } from '../../../lib/api'
import { fetchFoodDetail, fetchFoodReservations, foodKeys, type FoodReservation } from '../../../lib/queries/food'
import { formatDateOnly, formatDateTime } from '../../../lib/format'
import { useToast } from '../../../lib/toast'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  available: { bg: '#d1fae5', text: '#065f46' },
  reserved: { bg: '#fef3c7', text: '#92400e' },
  picked_up: { bg: '#e5e7eb', text: '#374151' },
}

function getStatusLabel(food: { status: string; remainingQuantity?: number }) {
  if (food.status === 'available' && typeof food.remainingQuantity === 'number') {
    return food.remainingQuantity === 1 ? 'available (1 left)' : `available (${food.remainingQuantity} left)`
  }
  return food.status.replace('_', ' ')
}

export default function FoodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [pickupAtDate, setPickupAtDate] = useState<Date | null>(null)
  const [showIosPicker, setShowIosPicker] = useState(false)
  const [notes, setNotes] = useState('')

  const foodQuery = useQuery({
    queryKey: foodKeys.detail(id ?? ''),
    queryFn: () => fetchFoodDetail(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  })

  const reservationsQuery = useQuery({
    queryKey: foodKeys.reservations(id ?? ''),
    queryFn: () => fetchFoodReservations(id as string),
    enabled: Boolean(id) && Boolean(user),
    staleTime: 30_000,
  })

  const food = foodQuery.data
  const reservations = reservationsQuery.data ?? []

  const activeReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status !== 'cancelled' && reservation.status !== 'rejected'),
    [reservations]
  )

  const reserveMutation = useMutation({
    mutationFn: async () => {
      if (!pickupAtDate) throw new Error('VALIDATION_ERROR')
      const res = await apiFetch(`/api/food-shares/${id}/reservations`, {
        method: 'POST',
        body: JSON.stringify({ pickupAt: pickupAtDate.toISOString(), notes: notes || undefined }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      return json.data
    },
    onSuccess: () => {
      setPickupAtDate(null)
      setShowIosPicker(false)
      setNotes('')
      showToast({ message: 'Reservation requested!', variant: 'success' })
      void queryClient.invalidateQueries({ queryKey: foodKeys.all })
      void foodQuery.refetch()
      void reservationsQuery.refetch()
    },
    onError: (err) => {
      const messages: Record<string, string> = {
        FOOD_NOT_AVAILABLE: 'This listing is no longer available.',
        CANNOT_RESERVE_OWN_FOOD: 'You cannot reserve your own listing.',
        UNVERIFIED_EMAIL: 'Please verify your email first.',
        VALIDATION_ERROR: 'Please choose pickup date and time.',
        DUPLICATE_ACTIVE_RESERVATION: 'You already have an active reservation for this listing.',
      }
      Alert.alert('Error', messages[err.message] ?? 'Something went wrong.')
    },
  })

  const reservationMutation = useMutation({
    mutationFn: async (payload: { reservationId: string; action: 'approve' | 'reject' | 'cancel' | 'picked_up'; cancellationReason?: string }) => {
      const res = await apiFetch(`/api/food-shares/${id}/reservations/${payload.reservationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: payload.action, cancellationReason: payload.cancellationReason }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      return json.data as FoodReservation
    },
    onSuccess: (_, variables) => {
      const toastMessages: Record<string, string> = {
        approve: 'Reservation approved.',
        reject: 'Reservation declined.',
        cancel: 'Reservation cancelled.',
        picked_up: 'Marked as picked up.',
      }
      showToast({ message: toastMessages[variables.action] ?? 'Done.', variant: 'success' })
      void queryClient.invalidateQueries({ queryKey: foodKeys.all })
      void foodQuery.refetch()
      void reservationsQuery.refetch()
    },
    onError: (err) => {
      const messages: Record<string, string> = {
        INVALID_TRANSITION: 'This reservation cannot change to that state.',
        FORBIDDEN: 'You are not allowed to do that.',
      }
      Alert.alert('Error', messages[err.message] ?? 'Something went wrong.')
    },
  })

  if (foodQuery.isLoading) {
    return <View style={styles.center}><ActivityIndicator color="#15803d" size="large" /></View>
  }

  if (foodQuery.isError || !food) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load this food listing.</Text>
        <TouchableOpacity onPress={() => void foodQuery.refetch()} style={styles.retryBtn}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
      </View>
    )
  }

  const sc = STATUS_COLORS[food.status] ?? { bg: '#f3f4f6', text: '#6b7280' }
  const isOwner = user?.id === food.ownerId
  const myReservation = reservations.find((reservation) => reservation.requesterId === user?.id)
  const isOpen = food.status === 'available'

  function handleReserve() {
    if (!user) {
      Alert.alert('Login required', 'Please log in to reserve food.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log in', onPress: () => router.push('/(auth)/login') },
      ])
      return
    }
    reserveMutation.mutate()
  }

  function handleCancelReservation(reservationId: string) {
    Alert.alert('Cancel reservation', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: () => reservationMutation.mutate({ reservationId, action: 'cancel', cancellationReason: 'Cancelled by requester' }) },
    ])
  }

  function onPickupChange(event: DateTimePickerEvent, selected?: Date) {
    if (selected) {
      setPickupAtDate(selected)
    }
  }

  function openPickupPicker() {
    const now = new Date()
    const value = pickupAtDate ?? new Date(now.getTime() + 60 * 60 * 1000)

    if (Platform.OS === 'android') {
      const updateDatePart = (base: Date, picked: Date) => {
        const next = new Date(base)
        next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate())
        return next
      }

      const updateTimePart = (base: Date, picked: Date) => {
        const next = new Date(base)
        next.setHours(picked.getHours(), picked.getMinutes(), 0, 0)
        return next
      }

      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        minimumDate: now,
        onChange: (dateEvent, dateSelected) => {
          if (dateEvent.type !== 'set' || !dateSelected) {
            return
          }

          const dateWithPickedDay = updateDatePart(value, dateSelected)
          DateTimePickerAndroid.open({
            value: dateWithPickedDay,
            mode: 'time',
            is24Hour: true,
            onChange: (timeEvent, timeSelected) => {
              if (timeEvent.type !== 'set' || !timeSelected) {
                return
              }

              setPickupAtDate(updateTimePart(dateWithPickedDay, timeSelected))
            },
          })
        },
        is24Hour: true,
      })
      return
    }

    setShowIosPicker((current) => !current)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{food.title}</Text>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}><Text style={[styles.badgeText, { color: sc.text }]}>{getStatusLabel(food)}</Text></View>
      </View>

      {food.description ? <Text style={styles.description}>{food.description}</Text> : null}

      <View style={styles.detailsBox}>
        <DetailRow label="Quantity" value={String(food.quantity)} />
        <DetailRow label="Left" value={String(food.remainingQuantity ?? food.quantity)} />
        <DetailRow label="Organised by" value={food.ownerName ?? 'Anonymous'} />
        <DetailRow label="Location" value={food.locationNeighborhood ? `${food.locationNeighborhood}, ${food.locationCity}` : '—'} />
        {food.availableUntil && <DetailRow label="Available until" value={formatDateOnly(food.availableUntil)} />}
        <DetailRow label="Reservations" value={String(food.reservationCount)} />
        {food.pickupInstructions && <DetailRow label="Pickup" value={food.pickupInstructions} />}
      </View>

      {isOwner ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Reservation requests</Text>
          {activeReservations.length === 0 ? (
            <Text style={styles.emptyText}>No active reservations yet.</Text>
          ) : (
            activeReservations.map((reservation) => (
              <View key={reservation.id} style={styles.reservationCard}>
                <Text style={styles.reservationTitle}>{reservation.requesterName ?? 'Anonymous'}</Text>
                <Text style={styles.reservationMeta}>Pickup: {formatDateTime(reservation.pickupAt)}</Text>
                {reservation.notes ? <Text style={styles.reservationNotes}>{reservation.notes}</Text> : null}
                <View style={styles.actionRow}>
                  {reservation.status === 'pending' && (
                    <>
                      <TouchableOpacity style={styles.greenBtn} onPress={() => reservationMutation.mutate({ reservationId: reservation.id, action: 'approve' })}>
                        <Text style={styles.greenBtnText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.grayBtn} onPress={() => reservationMutation.mutate({ reservationId: reservation.id, action: 'reject' })}>
                        <Text style={styles.grayBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {reservation.status === 'reserved' && (
                    <TouchableOpacity style={styles.blueBtn} onPress={() => reservationMutation.mutate({ reservationId: reservation.id, action: 'picked_up' })}>
                      <Text style={styles.blueBtnText}>Picked up</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.redOutlineBtn} onPress={() => reservationMutation.mutate({ reservationId: reservation.id, action: 'cancel', cancellationReason: 'Cancelled by owner' })}>
                    <Text style={styles.redOutlineBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      ) : myReservation?.status === 'pending' || myReservation?.status === 'reserved' ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your reservation</Text>
          <View style={styles.reservationCard}>
            <Text style={styles.reservationMeta}>Pickup: {formatDateTime(myReservation.pickupAt)}</Text>
            {myReservation.notes ? <Text style={styles.reservationNotes}>{myReservation.notes}</Text> : null}
            <TouchableOpacity style={styles.redOutlineBtn} onPress={() => handleCancelReservation(myReservation.id)}>
              <Text style={styles.redOutlineBtnText}>Cancel reservation</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : isOpen ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Reserve this food</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={openPickupPicker}>
            <Text style={pickupAtDate ? styles.dateBtnValue : styles.dateBtnPlaceholder}>
              {pickupAtDate ? formatDateTime(pickupAtDate.toISOString()) : 'Select pickup date and time'}
            </Text>
          </TouchableOpacity>
          {Platform.OS === 'ios' && showIosPicker ? (
            <View style={styles.iosPickerWrap}>
              <DateTimePicker
                value={pickupAtDate ?? new Date(Date.now() + 60 * 60 * 1000)}
                mode="datetime"
                minimumDate={new Date()}
                onChange={onPickupChange}
                minuteInterval={5}
              />
            </View>
          ) : null}
          <TextInput style={[styles.input, styles.textarea]} value={notes} onChangeText={setNotes} placeholder="Notes" multiline numberOfLines={3} textAlignVertical="top" maxLength={500} />
          <TouchableOpacity style={[styles.greenWideBtn, reserveMutation.isPending && styles.disabledBtn]} onPress={handleReserve} disabled={reserveMutation.isPending || !pickupAtDate}>
            {reserveMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.greenWideBtnText}>Reserve food</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.closedNote}>This listing is no longer available for new reservations.</Text>
      )}

      {!user && isOpen && (
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push(`/(auth)/login`)}>
          <Text style={styles.loginBtnText}>Log in to reserve</Text>
        </TouchableOpacity>
      )}

      {isOwner && (
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/(app)/food/edit/${food.id}`)}>
          <Text style={styles.editBtnText}>Edit listing</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: '#111827', lineHeight: 26 },
  badge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  description: { fontSize: 14, color: '#4b5563', lineHeight: 22 },
  detailsBox: { backgroundColor: '#fff', borderRadius: 10, padding: 14, gap: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  detailLabel: { fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.4, flex: 1 },
  detailValue: { fontSize: 13, color: '#111827', fontWeight: '500', flex: 2, textAlign: 'right' },
  section: { gap: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 },
  reservationCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', gap: 8 },
  reservationTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  reservationMeta: { fontSize: 13, color: '#4b5563' },
  reservationNotes: { fontSize: 13, color: '#4b5563' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  greenBtn: { backgroundColor: '#15803d', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  greenBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  grayBtn: { borderWidth: 1, borderColor: '#d1d5db', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#fff' },
  grayBtnText: { color: '#374151', fontSize: 13, fontWeight: '600' },
  blueBtn: { backgroundColor: '#1d4ed8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  blueBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  redOutlineBtn: { borderWidth: 1, borderColor: '#fca5a5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#fff' },
  redOutlineBtnText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  dateBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  dateBtnPlaceholder: { color: '#9ca3af', fontSize: 14 },
  dateBtnValue: { color: '#111827', fontSize: 14 },
  iosPickerWrap: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: '#111827' },
  textarea: { minHeight: 96 },
  greenWideBtn: { backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  greenWideBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disabledBtn: { opacity: 0.6 },
  closedNote: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  loginBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  loginBtnText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  editBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  editBtnText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  backBtn: { alignItems: 'center', paddingVertical: 8 },
  backBtnText: { color: '#6b7280', fontSize: 14 },
  errorText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 8, backgroundColor: '#15803d' },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 13, color: '#9ca3af' },
})