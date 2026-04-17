import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import { apiFetch } from '../../../lib/api'
import {
  fetchDriveDetail,
  fetchDrivePledges,
  drivesKeys,
  type DrivePledge,
} from '../../../lib/queries/drives'
import { formatDateOnly } from '../../../lib/format'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open:      { bg: '#d1fae5', text: '#065f46' },
  completed: { bg: '#dbeafe', text: '#1e40af' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
}

const TYPE_LABELS: Record<string, string> = {
  items: 'Items', food: 'Food', money: 'Money', other: 'Other',
}

export default function DriveDetailScreen() {
  const { id }           = useLocalSearchParams<{ id: string }>()
  const { user }         = useAuth()
  const router           = useRouter()
  const queryClient      = useQueryClient()
  const [pledgeDesc, setPledgeDesc] = useState('')

  const driveQuery = useQuery({
    queryKey: drivesKeys.detail(id ?? ''),
    queryFn:  () => fetchDriveDetail(id as string),
    enabled:  Boolean(id),
    staleTime: 30_000,
  })

  const pledgesQuery = useQuery({
    queryKey: drivesKeys.pledges(id ?? ''),
    queryFn:  () => fetchDrivePledges(id as string),
    enabled:  Boolean(id),
    staleTime: 30_000,
  })

  const pledgeMutation = useMutation({
    mutationFn: async (action: 'create' | 'cancel') => {
      if (action === 'create') {
        if (!pledgeDesc.trim()) throw new Error('EMPTY_DESC')
        const res = await apiFetch(`/api/drives/${id}/pledges`, {
          method: 'POST',
          body: JSON.stringify({ pledgeDescription: pledgeDesc.trim() }),
        })
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
        return { action, data: json.data }
      } else {
        const myPledge = pledgesQuery.data?.find(
          (p) => p.userId === user?.id && p.status === 'pledged'
        )
        if (!myPledge) throw new Error('NO_PLEDGE')
        const res = await apiFetch(`/api/drives/${id}/pledges/${myPledge.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'cancelled' }),
        })
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
        return { action, data: json.data }
      }
    },
    onSuccess: () => {
      setPledgeDesc('')
      void queryClient.invalidateQueries({ queryKey: drivesKeys.pledges(id ?? '') })
      void queryClient.invalidateQueries({ queryKey: drivesKeys.detail(id ?? '') })
    },
    onError: (err) => {
      const msg: Record<string, string> = {
        EMPTY_DESC:            'Please describe what you are pledging.',
        DRIVE_NOT_OPEN:        'This drive is no longer accepting pledges.',
        CANNOT_PLEDGE_OWN_DRIVE: 'You cannot pledge to your own drive.',
        TOO_MANY_REQUESTS:     'Too many attempts. Please wait.',
      }
      Alert.alert('Error', msg[err.message] ?? 'Something went wrong.')
    },
  })

  const drive   = driveQuery.data
  const pledges = pledgesQuery.data ?? []

  if (driveQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#15803d" size="large" />
      </View>
    )
  }

  if (driveQuery.isError || !drive) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load this drive.</Text>
        <TouchableOpacity onPress={() => void driveQuery.refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const sc = STATUS_COLORS[drive.status] ?? { bg: '#f3f4f6', text: '#6b7280' }
  const isOrganizer = user?.id === drive.organizerId
  const isOpen = drive.status === 'open'

  const myPledge = pledges.find((p) => p.userId === user?.id)
  const activePledges = pledges.filter((p) => p.status !== 'cancelled')

  function handlePledge() {
    if (!user) {
      Alert.alert('Login required', 'Please log in to pledge.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log in', onPress: () => router.push('/(auth)/login') },
      ])
      return
    }
    pledgeMutation.mutate('create')
  }

  function handleCancelPledge() {
    Alert.alert('Cancel pledge', 'Are you sure you want to cancel your pledge?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, cancel', style: 'destructive', onPress: () => pledgeMutation.mutate('cancel') },
    ])
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Title + status */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{drive.title}</Text>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.badgeText, { color: sc.text }]}>{drive.status}</Text>
        </View>
      </View>

      {drive.description ? (
        <Text style={styles.description}>{drive.description}</Text>
      ) : null}

      {/* Details */}
      <View style={styles.detailsBox}>
        <DetailRow label="Type"         value={TYPE_LABELS[drive.driveType] ?? drive.driveType} />
        <DetailRow label="Organised by" value={drive.organizerName ?? 'Anonymous'} />
        {drive.goalDescription  && <DetailRow label="Goal"          value={drive.goalDescription} />}
        {drive.dropOffAddress   && <DetailRow label="Drop-off"      value={drive.dropOffAddress} />}
        {drive.deadline         && <DetailRow label="Deadline"      value={formatDateOnly(drive.deadline)} />}
        <DetailRow label="Pledges" value={String(drive.pledgeCount)} />
      </View>

      {/* Pledges list */}
      {activePledges.length > 0 && (
        <View style={styles.pledgesSection}>
          <Text style={styles.sectionLabel}>Pledges ({activePledges.length})</Text>
          {activePledges.map((p) => (
            <PledgeRow key={p.id} pledge={p} />
          ))}
        </View>
      )}

      {/* Pledge action */}
      {!isOrganizer && isOpen && (
        <View style={styles.pledgeAction}>
          {myPledge?.status === 'pledged' ? (
            <>
              <View style={styles.myPledgeBox}>
                <Text style={styles.myPledgeLabel}>Your pledge</Text>
                <Text style={styles.myPledgeDesc}>{myPledge.pledgeDescription}</Text>
              </View>
              <TouchableOpacity
                style={styles.cancelPledgeBtn}
                onPress={handleCancelPledge}
                disabled={pledgeMutation.isPending}
              >
                <Text style={styles.cancelPledgeBtnText}>Cancel my pledge</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>
                {myPledge?.status === 'cancelled' ? 'Update your pledge' : 'Make a pledge'}
              </Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={pledgeDesc}
                onChangeText={setPledgeDesc}
                placeholder="Describe what you are contributing (e.g. 5 winter coats)…"
                maxLength={500}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.pledgeBtn, pledgeMutation.isPending && styles.pledgeBtnDisabled]}
                onPress={handlePledge}
                disabled={pledgeMutation.isPending || !pledgeDesc.trim()}
              >
                {pledgeMutation.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.pledgeBtnText}>Pledge support</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {isOrganizer && (
        <Text style={styles.organizerNote}>You are the organiser of this drive.</Text>
      )}

      {!isOpen && !isOrganizer && (
        <Text style={styles.closedNote}>This drive is no longer accepting pledges.</Text>
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

function PledgeRow({ pledge }: { pledge: DrivePledge }) {
  const isFulfilled = pledge.status === 'fulfilled'
  return (
    <View style={[styles.pledgeRow, isFulfilled && styles.pledgeRowFulfilled]}>
      <Text style={styles.pledgeUser}>{pledge.userName ?? 'Anonymous'}</Text>
      <Text style={styles.pledgeDesc}> — {pledge.pledgeDescription}</Text>
      {isFulfilled && <Text style={styles.fulfilledBadge}> ✓</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f9fafb' },
  content:     { padding: 16, gap: 16, paddingBottom: 40 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  titleRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  title:       { flex: 1, fontSize: 20, fontWeight: '700', color: '#111827', lineHeight: 26 },
  badge:       { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText:   { fontSize: 12, fontWeight: '600' },
  description: { fontSize: 14, color: '#4b5563', lineHeight: 22 },
  detailsBox:  { backgroundColor: '#fff', borderRadius: 10, padding: 14, gap: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  detailLabel: { fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.4, flex: 1 },
  detailValue: { fontSize: 13, color: '#111827', fontWeight: '500', flex: 2, textAlign: 'right' },
  pledgesSection: { gap: 6 },
  sectionLabel:   { fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 },
  pledgeRow:    { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  pledgeRowFulfilled: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  pledgeUser:   { fontSize: 13, fontWeight: '600', color: '#111827' },
  pledgeDesc:   { fontSize: 13, color: '#4b5563', flexShrink: 1 },
  fulfilledBadge: { fontSize: 12, color: '#15803d', fontWeight: '700' },
  pledgeAction: { gap: 10 },
  myPledgeBox:  { backgroundColor: '#f0fdf4', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#bbf7d0', gap: 4 },
  myPledgeLabel:{ fontSize: 12, fontWeight: '700', color: '#15803d' },
  myPledgeDesc: { fontSize: 14, color: '#166534' },
  cancelPledgeBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelPledgeBtnText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  textarea: { minHeight: 80 },
  pledgeBtn: { backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  pledgeBtnDisabled: { opacity: 0.6 },
  pledgeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  organizerNote: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 8 },
  closedNote:    { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 8 },
  errorText:   { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  retryBtn:    { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 8, backgroundColor: '#15803d' },
  retryText:   { color: '#fff', fontSize: 14, fontWeight: '600' },
})
