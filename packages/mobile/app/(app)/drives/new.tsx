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
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import { apiFetch } from '../../../lib/api'
import { drivesKeys } from '../../../lib/queries/drives'

const DRIVE_TYPES = [
  { key: 'items', label: '📦 Items' },
  { key: 'food',  label: '🍎 Food' },
  { key: 'money', label: '💰 Money' },
  { key: 'other', label: '🤝 Other' },
]

export default function NewDriveScreen() {
  const { user, loading } = useAuth()
  const router            = useRouter()
  const queryClient       = useQueryClient()

  const [title,        setTitle]       = useState('')
  const [driveType,    setDriveType]   = useState<string | null>(null)
  const [description,  setDesc]        = useState('')
  const [goal,         setGoal]        = useState('')
  const [dropOff,      setDropOff]     = useState('')
  const [deadline,     setDeadline]    = useState('')

  useEffect(() => {
    if (!loading && !user) router.replace('/(auth)/login')
  }, [loading, user, router])

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!driveType) throw new Error('TYPE_REQUIRED')

      const body: Record<string, unknown> = {
        title: title.trim(),
        driveType,
      }
      if (description.trim()) body.description     = description.trim()
      if (goal.trim())        body.goalDescription = goal.trim()
      if (dropOff.trim())     body.dropOffAddress  = dropOff.trim()
      if (deadline.trim()) {
        const d = new Date(deadline.trim())
        if (isNaN(d.getTime())) throw new Error('INVALID_DEADLINE')
        body.deadline = d.toISOString()
      }

      const res = await apiFetch('/api/drives', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      return json.data as { id: string }
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: drivesKeys.all })
      router.replace(`/(app)/drives/${data.id}`)
    },
    onError: (err) => {
      const msg: Record<string, string> = {
        TYPE_REQUIRED:    'Please select a drive type.',
        INVALID_DEADLINE: 'Invalid deadline date.',
        UNVERIFIED_EMAIL: 'Please verify your email before starting a drive.',
        TOO_MANY_REQUESTS:'Too many attempts. Please wait.',
        VALIDATION_ERROR: 'Please check your inputs.',
      }
      Alert.alert('Could not start drive', msg[err.message] ?? 'Something went wrong.')
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
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      <Field label="Title *">
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Winter coat collection, Food bank drive…"
          maxLength={200}
          returnKeyType="next"
        />
      </Field>

      <Field label="Type *">
        <View style={styles.typeRow}>
          {DRIVE_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeChip, driveType === t.key && styles.typeChipActive]}
              onPress={() => setDriveType(t.key)}
            >
              <Text style={[styles.typeChipText, driveType === t.key && styles.typeChipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="Description">
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDesc}
          placeholder="Tell the community about this drive…"
          maxLength={5000}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </Field>

      <Field label="Goal" hint="Optional — describe the target">
        <TextInput
          style={styles.input}
          value={goal}
          onChangeText={setGoal}
          placeholder="e.g. Collect 100 winter coats"
          maxLength={500}
          returnKeyType="next"
        />
      </Field>

      <Field label="Drop-off address" hint="Optional">
        <TextInput
          style={styles.input}
          value={dropOff}
          onChangeText={setDropOff}
          placeholder="Where to drop off contributions"
          maxLength={300}
          returnKeyType="next"
        />
      </Field>

      <Field label="Deadline" hint="Optional — format: YYYY-MM-DD">
        <TextInput
          style={[styles.input, styles.inputShort]}
          value={deadline}
          onChangeText={setDeadline}
          placeholder="2026-06-01"
          autoCapitalize="none"
          returnKeyType="done"
        />
      </Field>

      <TouchableOpacity
        style={[styles.submitBtn, createMutation.isPending && styles.submitBtnDisabled]}
        onPress={() => createMutation.mutate()}
        disabled={createMutation.isPending || !title.trim() || !driveType}
      >
        {createMutation.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitBtnText}>Start drive</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  kav:          { flex: 1 },
  container:    { flex: 1, backgroundColor: '#f9fafb' },
  content:      { padding: 16, gap: 16, paddingBottom: 40 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827',
  },
  textarea:   { minHeight: 80 },
  inputShort: { width: 140 },
  typeRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  typeChipActive:    { backgroundColor: '#15803d', borderColor: '#15803d' },
  typeChipText:      { fontSize: 13, color: '#374151' },
  typeChipTextActive:{ color: '#fff', fontWeight: '600' },
  submitBtn:         { backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn:         { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText:     { fontSize: 14, color: '#6b7280' },
})
