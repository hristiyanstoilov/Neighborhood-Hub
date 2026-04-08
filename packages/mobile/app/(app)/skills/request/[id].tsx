import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { apiFetch } from '../../../../lib/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

const MEETING_TYPES = [
  { value: 'in_person', label: 'In Person' },
  { value: 'online',    label: 'Online' },
  { value: 'hybrid',    label: 'Hybrid' },
] as const

type MeetingType = 'in_person' | 'online' | 'hybrid'

const TIME_SLOTS = [
  { label: 'Morning',   hour: 9 },
  { label: 'Noon',      hour: 12 },
  { label: 'Afternoon', hour: 15 },
  { label: 'Evening',   hour: 18 },
]

const DURATIONS = [
  { label: '1 hour',  hours: 1 },
  { label: '2 hours', hours: 2 },
  { label: '3 hours', hours: 3 },
]

function buildDayOptions(): { label: string; date: Date }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    d.setHours(0, 0, 0, 0)
    const label = i === 0
      ? 'Tomorrow'
      : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    return { label, date: d }
  })
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function RequestSkillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const DAY_OPTIONS = buildDayOptions()

  const [skillTitle, setSkillTitle] = useState<string | null>(null)
  const [skillOwner, setSkillOwner] = useState<string | null>(null)

  const [meetingType, setMeetingType] = useState<MeetingType>('in_person')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [dayIndex, setDayIndex] = useState(0)
  const [timeSlot, setTimeSlot] = useState(0)
  const [durationIndex, setDurationIndex] = useState(0)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    apiFetch(`/api/skills/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setSkillTitle(json.data.title ?? null)
          setSkillOwner(json.data.ownerName ?? null)
        }
      })
      .catch(() => {})
  }, [id])

  async function handleSubmit() {
    if (meetingType !== 'in_person' && !meetingUrl.trim()) {
      Alert.alert('Meeting URL required', 'Please provide a meeting link for online or hybrid sessions.')
      return
    }

    const day = new Date(DAY_OPTIONS[dayIndex].date)
    day.setHours(TIME_SLOTS[timeSlot].hour, 0, 0, 0)
    const end = new Date(day.getTime() + DURATIONS[durationIndex].hours * 60 * 60 * 1000)

    const body: Record<string, unknown> = {
      skillId: id,
      scheduledStart: day.toISOString(),
      scheduledEnd: end.toISOString(),
      meetingType,
    }
    if (meetingType !== 'in_person' && meetingUrl.trim()) body.meetingUrl = meetingUrl.trim()
    if (notes.trim()) body.notes = notes.trim()

    setSubmitting(true)
    try {
      const res = await apiFetch('/api/skill-requests', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (!res.ok) {
        const msgs: Record<string, string> = {
          UNVERIFIED_EMAIL:       'Please verify your email before requesting skills.',
          SKILL_NOT_AVAILABLE:    'This skill is no longer available.',
          REQUEST_ALREADY_EXISTS: 'You already have an active request for this skill.',
          VALIDATION_ERROR:       'Please check your inputs.',
          TOO_MANY_REQUESTS:      'Too many attempts. Please wait.',
        }
        Alert.alert('Could not send request', msgs[json.error] ?? 'Something went wrong.')
        return
      }

      Alert.alert(
        'Request sent!',
        'The skill owner will be notified.',
        [
          { text: 'OK', onPress: () => router.back() },
          { text: 'View My Requests', onPress: () => router.push('/(app)/(tabs)/my-requests') },
        ]
      )
    } catch {
      Alert.alert('Error', 'Network error. Please check your connection.')
    } finally {
      setSubmitting(false)
    }
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

      {/* Meeting type */}
      <View style={styles.field}>
        <Text style={styles.label}>Meeting type</Text>
        <View style={styles.chipRow}>
          {MEETING_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.chip, meetingType === t.value && styles.chipActive]}
              onPress={() => setMeetingType(t.value)}
            >
              <Text style={[styles.chipText, meetingType === t.value && styles.chipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Meeting URL — only for online / hybrid */}
      {meetingType !== 'in_person' && (
        <View style={styles.field}>
          <Text style={styles.label}>
            Meeting URL <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={meetingUrl}
            onChangeText={setMeetingUrl}
            placeholder="https://meet.google.com/…"
            autoCapitalize="none"
            keyboardType="url"
            maxLength={2048}
          />
        </View>
      )}

      {/* Date */}
      <View style={styles.field}>
        <Text style={styles.label}>Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {DAY_OPTIONS.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dateChip, dayIndex === i && styles.chipActive]}
              onPress={() => setDayIndex(i)}
            >
              <Text style={[styles.dateChipText, dayIndex === i && styles.chipTextActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Time */}
      <View style={styles.field}>
        <Text style={styles.label}>Time</Text>
        <View style={styles.chipRow}>
          {TIME_SLOTS.map((t, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.chip, timeSlot === i && styles.chipActive]}
              onPress={() => setTimeSlot(i)}
            >
              <Text style={[styles.chipText, timeSlot === i && styles.chipTextActive]}>
                {t.label}{'\n'}{String(t.hour).padStart(2, '0')}:00
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Duration */}
      <View style={styles.field}>
        <Text style={styles.label}>Duration</Text>
        <View style={styles.chipRow}>
          {DURATIONS.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.chip, durationIndex === i && styles.chipActive]}
              onPress={() => setDurationIndex(i)}
            >
              <Text style={[styles.chipText, durationIndex === i && styles.chipTextActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.field}>
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any details for the skill owner…"
          maxLength={1000}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {DAY_OPTIONS[dayIndex].label} at {String(TIME_SLOTS[timeSlot].hour).padStart(2, '0')}:00
          {' · '}{DURATIONS[durationIndex].label}
          {' · '}{MEETING_TYPES.find((t) => t.value === meetingType)?.label}
        </Text>
      </View>

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
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  required: { color: '#dc2626' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  textarea: { minHeight: 80, paddingTop: 10 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipScroll: { flexDirection: 'row' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#15803d', borderColor: '#15803d' },
  chipText: { fontSize: 13, color: '#374151', textAlign: 'center' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    marginRight: 8,
    minWidth: 72,
    alignItems: 'center',
  },
  dateChipText: { fontSize: 12, color: '#374151', textAlign: 'center' },

  summary: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  summaryText: { fontSize: 13, color: '#15803d', fontWeight: '500', textAlign: 'center' },

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