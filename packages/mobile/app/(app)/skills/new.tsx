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
import { useRouter } from 'expo-router'
import { useAuth } from '../../../contexts/auth'
import { apiFetch } from '../../../lib/api'

interface Category { id: string; slug: string; label: string }
interface Location { id: string; city: string; neighborhood: string }

export default function NewSkillScreen() {
  const router = useRouter()
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [availableHours, setAvailableHours] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState<string | null>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, locRes] = await Promise.all([
          apiFetch('/api/categories'),
          apiFetch('/api/locations'),
        ])
        const [catJson, locJson] = await Promise.all([catRes.json(), locRes.json()])
        setCategories(catJson.data ?? [])
        // locations API returns skillCount too — only need id/city/neighborhood
        setLocations((locJson.data ?? []).map((l: any) => ({
          id: l.id,
          city: l.city,
          neighborhood: l.neighborhood,
        })))
      } catch {
        Alert.alert('Error', 'Could not load form data. Please try again.')
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [])

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for your skill.')
      return
    }
    if (title.trim().length < 3) {
      Alert.alert('Too short', 'Title must be at least 3 characters.')
      return
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
      }
      if (description.trim()) body.description = description.trim()
      if (categoryId) body.categoryId = categoryId
      if (locationId) body.locationId = locationId
      const hours = parseInt(availableHours, 10)
      if (!isNaN(hours) && hours >= 0 && hours <= 168) body.availableHours = hours

      const res = await apiFetch('/api/skills', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (!res.ok) {
        const msgs: Record<string, string> = {
          UNVERIFIED_EMAIL: 'Please verify your email before offering a skill.',
          VALIDATION_ERROR: 'Please check your inputs.',
          TOO_MANY_REQUESTS: 'Too many attempts. Please wait and try again.',
          UNAUTHORIZED: 'You must be logged in to offer a skill.',
        }
        Alert.alert('Could not publish', msgs[json.error] ?? 'Something went wrong.')
        return
      }

      router.replace(`/(app)/skills/${json.data.id}`)
    } catch {
      Alert.alert('Error', 'Network error. Please check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>You must be logged in to offer a skill.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.btnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (loadingData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>Offer a skill</Text>

      {/* Title */}
      <View style={styles.field}>
        <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Guitar lessons, Python tutoring…"
          maxLength={200}
          returnKeyType="next"
        />
      </View>

      {/* Description */}
      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what you offer, your experience…"
          maxLength={2000}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Hours / week */}
      <View style={styles.field}>
        <Text style={styles.label}>Hours available / week</Text>
        <TextInput
          style={[styles.input, styles.inputSmall]}
          value={availableHours}
          onChangeText={setAvailableHours}
          placeholder="e.g. 5"
          keyboardType="number-pad"
          maxLength={3}
        />
      </View>

      {/* Category picker */}
      <View style={styles.field}>
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <TouchableOpacity
            style={[styles.chip, !categoryId && styles.chipActive]}
            onPress={() => setCategoryId(null)}
          >
            <Text style={[styles.chipText, !categoryId && styles.chipTextActive]}>Any</Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, categoryId === c.id && styles.chipActive]}
              onPress={() => setCategoryId(c.id)}
            >
              <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Location picker */}
      <View style={styles.field}>
        <Text style={styles.label}>Location</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <TouchableOpacity
            style={[styles.chip, !locationId && styles.chipActive]}
            onPress={() => setLocationId(null)}
          >
            <Text style={[styles.chipText, !locationId && styles.chipTextActive]}>Any</Text>
          </TouchableOpacity>
          {locations.map((l) => (
            <TouchableOpacity
              key={l.id}
              style={[styles.chip, locationId === l.id && styles.chipActive]}
              onPress={() => setLocationId(l.id)}
            >
              <Text style={[styles.chipText, locationId === l.id && styles.chipTextActive]}>
                {l.neighborhood}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
            : <Text style={styles.submitBtnText}>Publish skill</Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f3f4f6' },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 20 },
  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
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
  inputSmall: { width: 100 },
  textarea: { minHeight: 90, paddingTop: 10 },
  chipScroll: { flexDirection: 'row' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#15803d', borderColor: '#15803d' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  actions: { gap: 10, marginTop: 8 },
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
  btn: { backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24, marginTop: 12 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  errorText: { color: '#dc2626', fontSize: 14, marginBottom: 12 },
})