import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import { apiFetch } from '../../../lib/api'
import { eventsKeys } from '../../../lib/queries/events'

export default function NewEventScreen() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [title, setTitle]       = useState('')
  const [description, setDesc]  = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt]     = useState('')
  const [address, setAddress]   = useState('')
  const [maxCapacity, setMaxCap]= useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/login')
    }
  }, [loading, user, router])

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!startsAt.trim()) throw new Error('START_REQUIRED')

      const startsDate = new Date(startsAt.trim())
      if (isNaN(startsDate.getTime())) throw new Error('INVALID_DATE')

      const endsDate = endsAt.trim() ? new Date(endsAt.trim()) : null
      if (endsDate && isNaN(endsDate.getTime())) throw new Error('INVALID_DATE')
      if (endsDate && endsDate <= startsDate) throw new Error('ENDS_BEFORE_STARTS')

      const body: Record<string, unknown> = {
        title: title.trim(),
        startsAt: startsDate.toISOString(),
      }
      if (description.trim()) body.description  = description.trim()
      if (endsAt.trim())       body.endsAt       = endsDate!.toISOString()
      if (address.trim())      body.address      = address.trim()
      if (maxCapacity.trim())  body.maxCapacity  = parseInt(maxCapacity, 10)

      const res = await apiFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      return json.data as { id: string }
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: eventsKeys.all })
      router.replace(`/(app)/events/${data.id}`)
    },
    onError: (err) => {
      const msg: Record<string, string> = {
        START_REQUIRED:     'Please enter a start date and time.',
        INVALID_DATE:       'Invalid date format. Use YYYY-MM-DDTHH:MM.',
        ENDS_BEFORE_STARTS: 'End time must be after start time.',
        UNVERIFIED_EMAIL:  'Please verify your email before creating an event.',
        TOO_MANY_REQUESTS: 'Too many attempts. Please wait.',
        VALIDATION_ERROR:  'Please check your inputs.',
      }
      Alert.alert('Could not create event', msg[err.message] ?? 'Something went wrong. Please try again.')
    },
  })

  if (loading || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#15803d" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      <Field label="Title *">
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Neighbourhood clean-up, Block party…"
          maxLength={200}
          returnKeyType="next"
        />
      </Field>

      <Field label="Description">
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDesc}
          placeholder="Tell people what to expect…"
          maxLength={5000}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Field>

      <Field label="Starts at *" hint="Format: YYYY-MM-DDTHH:MM (e.g. 2026-05-01T18:00)">
        <TextInput
          style={styles.input}
          value={startsAt}
          onChangeText={setStartsAt}
          placeholder="2026-05-01T18:00"
          autoCapitalize="none"
          returnKeyType="next"
        />
      </Field>

      <Field label="Ends at" hint="Optional">
        <TextInput
          style={styles.input}
          value={endsAt}
          onChangeText={setEndsAt}
          placeholder="2026-05-01T20:00"
          autoCapitalize="none"
          returnKeyType="next"
        />
      </Field>

      <Field label="Address">
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Street address or venue name"
          maxLength={300}
          returnKeyType="next"
        />
      </Field>

      <Field label="Max attendees" hint="Optional — leave blank for unlimited">
        <TextInput
          style={[styles.input, styles.inputShort]}
          value={maxCapacity}
          onChangeText={setMaxCap}
          placeholder="e.g. 30"
          keyboardType="number-pad"
          returnKeyType="done"
        />
      </Field>

      <TouchableOpacity
        style={[styles.submitBtn, createMutation.isPending && styles.submitBtnDisabled]}
        onPress={() => createMutation.mutate()}
        disabled={createMutation.isPending || !title.trim()}
      >
        {createMutation.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitBtnText}>Create event</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={fieldStyles.container}>
      <Text style={fieldStyles.label}>{label}</Text>
      {hint && <Text style={fieldStyles.hint}>{hint}</Text>}
      {children}
    </View>
  )
}

const fieldStyles = StyleSheet.create({
  container: { gap: 4 },
  label:     { fontSize: 13, fontWeight: '600', color: '#374151' },
  hint:      { fontSize: 11, color: '#9ca3af' },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content:   { padding: 16, gap: 16, paddingBottom: 40 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  textarea:    { minHeight: 96 },
  inputShort:  { width: 120 },
  submitBtn: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelBtnText: { fontSize: 14, color: '#6b7280' },
})
