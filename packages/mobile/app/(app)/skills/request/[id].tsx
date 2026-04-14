import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../../lib/api'
import { SkillNotFoundError, fetchSkillDetail, skillDetailKeys } from '../../../../lib/queries/skill-detail'
import { skillRequestsKeys } from '../../../../lib/queries/skill-requests'
import {
  DURATIONS,
  MEETING_TYPES,
  TIME_SLOTS,
  buildDayOptions,
  RequestDateSection,
  RequestDurationSection,
  RequestMeetingTypeSection,
  RequestMeetingUrlSection,
  RequestNotesSection,
  RequestSummaryCard,
  RequestTimeSection,
  type MeetingType,
} from '../_components/request-form-core'

// ── Screen ────────────────────────────────────────────────────────────────────

export default function RequestSkillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const skillId = typeof id === 'string' ? id : ''

  const DAY_OPTIONS = buildDayOptions()

  const [meetingType, setMeetingType] = useState<MeetingType>('in_person')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [dayIndex, setDayIndex] = useState(0)
  const [timeSlot, setTimeSlot] = useState(0)
  const [durationIndex, setDurationIndex] = useState(0)
  const [notes, setNotes] = useState('')
  const skillQuery = useQuery({
    queryKey: skillDetailKeys.detail(skillId),
    queryFn: () => fetchSkillDetail(skillId),
    enabled: skillId.length > 0,
  })

  const createRequestMutation = useMutation({
    mutationFn: async (payload: {
      scheduledStart: string
      scheduledEnd: string
      meetingType: MeetingType
      meetingUrl?: string
      notes?: string
    }) => {
      const body: Record<string, unknown> = {
        skillId,
        scheduledStart: payload.scheduledStart,
        scheduledEnd: payload.scheduledEnd,
        meetingType: payload.meetingType,
      }

      if (payload.meetingUrl) body.meetingUrl = payload.meetingUrl
      if (payload.notes) body.notes = payload.notes

      const res = await apiFetch('/api/skill-requests', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        const code = json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string'
          ? (json as { error: string }).error
          : 'UNKNOWN_ERROR'
        throw new Error(code)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: skillRequestsKeys.all })
      Alert.alert(
        'Request sent!',
        'The skill owner will be notified.',
        [
          { text: 'OK', onPress: () => router.back() },
          { text: 'View My Requests', onPress: () => router.push('/(app)/(tabs)/my-requests') },
        ]
      )
    },
  })

  async function handleSubmit() {
    if (!skillId) {
      Alert.alert('Invalid request', 'Missing skill identifier.')
      return
    }

    if (meetingType !== 'in_person' && !meetingUrl.trim()) {
      Alert.alert('Meeting URL required', 'Please provide a meeting link for online or hybrid sessions.')
      return
    }

    const day = new Date(DAY_OPTIONS[dayIndex].date)
    day.setHours(TIME_SLOTS[timeSlot].hour, 0, 0, 0)
    const end = new Date(day.getTime() + DURATIONS[durationIndex].hours * 60 * 60 * 1000)

    try {
      await createRequestMutation.mutateAsync({
        scheduledStart: day.toISOString(),
        scheduledEnd: end.toISOString(),
        meetingType,
        ...(meetingType !== 'in_person' && meetingUrl.trim() ? { meetingUrl: meetingUrl.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      })
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      const msgs: Record<string, string> = {
        UNVERIFIED_EMAIL: 'Please verify your email before requesting skills.',
        SKILL_NOT_AVAILABLE: 'This skill is no longer available.',
        REQUEST_ALREADY_EXISTS: 'You already have an active request for this skill.',
        VALIDATION_ERROR: 'Please check your inputs.',
        TOO_MANY_REQUESTS: 'Too many attempts. Please wait.',
      }
      Alert.alert('Could not send request', msgs[code] ?? 'Something went wrong.')
    }
  }

  const submitting = createRequestMutation.isPending
  const skillTitle = skillQuery.data?.title ?? null
  const skillOwner = skillQuery.data?.ownerName ?? null

  if (!skillId) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.errorText}>Invalid skill id.</Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (skillQuery.isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    )
  }

  if (skillQuery.error instanceof SkillNotFoundError) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.errorText}>Skill not found.</Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (skillQuery.isError) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.errorText}>Could not load skill details.</Text>
        <TouchableOpacity style={styles.submitBtn} onPress={() => void skillQuery.refetch()}>
          <Text style={styles.submitBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.pageTitle}>Request this skill</Text>

      {(skillTitle || skillOwner) && (
        <View style={styles.skillInfo}>
          {skillTitle && <Text style={styles.skillInfoTitle}>{skillTitle}</Text>}
          {skillOwner && <Text style={styles.skillInfoOwner}>Offered by {skillOwner}</Text>}
        </View>
      )}

      <RequestMeetingTypeSection meetingType={meetingType} onChangeMeetingType={setMeetingType} />

      {meetingType !== 'in_person' && (
        <RequestMeetingUrlSection meetingUrl={meetingUrl} onChangeMeetingUrl={setMeetingUrl} />
      )}

      <RequestDateSection dayOptions={DAY_OPTIONS} dayIndex={dayIndex} onChangeDayIndex={setDayIndex} />
      <RequestTimeSection timeSlot={timeSlot} onChangeTimeSlot={setTimeSlot} />
      <RequestDurationSection durationIndex={durationIndex} onChangeDurationIndex={setDurationIndex} />
      <RequestNotesSection notes={notes} onChangeNotes={setNotes} />
      <RequestSummaryCard
        dayLabel={DAY_OPTIONS[dayIndex].label}
        timeHour={TIME_SLOTS[timeSlot].hour}
        durationLabel={DURATIONS[durationIndex].label}
        meetingTypeLabel={MEETING_TYPES.find((t) => t.value === meetingType)?.label ?? 'In Person'}
      />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.disabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Send request</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 20, paddingBottom: 48 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f3f4f6', gap: 10 },
  errorText: { color: '#dc2626', fontSize: 14 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 20 },
  skillInfo: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  skillInfoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  skillInfoOwner: {
    fontSize: 13,
    color: '#15803d',
  },
  actions: { gap: 10 },
  submitBtn: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  disabled: { opacity: 0.6 },
  cancelBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelBtnText: { color: '#374151', fontWeight: '500', fontSize: 14 },
})