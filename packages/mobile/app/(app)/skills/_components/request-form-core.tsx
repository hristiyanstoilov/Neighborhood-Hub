import React from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'

export type MeetingType = 'in_person' | 'online' | 'hybrid'

export const MEETING_TYPES = [
  { value: 'in_person', label: 'In Person' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Hybrid' },
] as const

export const TIME_SLOTS = [
  { label: 'Morning', hour: 9 },
  { label: 'Noon', hour: 12 },
  { label: 'Afternoon', hour: 15 },
  { label: 'Evening', hour: 18 },
]

export const DURATIONS = [
  { label: '1 hour', hours: 1 },
  { label: '2 hours', hours: 2 },
  { label: '3 hours', hours: 3 },
]

export type DayOption = { label: string; date: Date }

export function buildDayOptions(): DayOption[] {
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

export function RequestMeetingTypeSection(props: {
  meetingType: MeetingType
  onChangeMeetingType: (value: MeetingType) => void
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Meeting type</Text>
      <View style={styles.chipRow}>
        {MEETING_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[styles.chip, props.meetingType === type.value && styles.chipActive]}
            onPress={() => props.onChangeMeetingType(type.value)}
          >
            <Text style={[styles.chipText, props.meetingType === type.value && styles.chipTextActive]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export function RequestMeetingUrlSection(props: {
  meetingUrl: string
  onChangeMeetingUrl: (value: string) => void
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        Meeting URL <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        style={styles.input}
        value={props.meetingUrl}
        onChangeText={props.onChangeMeetingUrl}
        placeholder="https://meet.google.com/…"
        autoCapitalize="none"
        keyboardType="url"
        maxLength={2048}
      />
    </View>
  )
}

export function RequestDateSection(props: {
  dayOptions: DayOption[]
  dayIndex: number
  onChangeDayIndex: (value: number) => void
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {props.dayOptions.map((day, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.dateChip, props.dayIndex === i && styles.chipActive]}
            onPress={() => props.onChangeDayIndex(i)}
          >
            <Text style={[styles.dateChipText, props.dayIndex === i && styles.chipTextActive]}>{day.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

export function RequestTimeSection(props: {
  timeSlot: number
  onChangeTimeSlot: (value: number) => void
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Time</Text>
      <View style={styles.chipRow}>
        {TIME_SLOTS.map((slot, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.chip, props.timeSlot === i && styles.chipActive]}
            onPress={() => props.onChangeTimeSlot(i)}
          >
            <Text style={[styles.chipText, props.timeSlot === i && styles.chipTextActive]}>
              {slot.label}{'\n'}{String(slot.hour).padStart(2, '0')}:00
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export function RequestDurationSection(props: {
  durationIndex: number
  onChangeDurationIndex: (value: number) => void
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Duration</Text>
      <View style={styles.chipRow}>
        {DURATIONS.map((duration, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.chip, props.durationIndex === i && styles.chipActive]}
            onPress={() => props.onChangeDurationIndex(i)}
          >
            <Text style={[styles.chipText, props.durationIndex === i && styles.chipTextActive]}>{duration.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export function RequestNotesSection(props: {
  notes: string
  onChangeNotes: (value: string) => void
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={props.notes}
        onChangeText={props.onChangeNotes}
        placeholder="Any details for the skill owner…"
        maxLength={1000}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </View>
  )
}

export function RequestSummaryCard(props: {
  dayLabel: string
  timeHour: number
  durationLabel: string
  meetingTypeLabel: string
}) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryText}>
        {props.dayLabel} at {String(props.timeHour).padStart(2, '0')}:00
        {' · '}{props.durationLabel}
        {' · '}{props.meetingTypeLabel}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
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
})