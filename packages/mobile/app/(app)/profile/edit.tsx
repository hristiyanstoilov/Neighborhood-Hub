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
import { apiFetch } from '../../../lib/api'

interface Location { id: string; city: string; neighborhood: string }

export default function EditProfileScreen() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [locationId, setLocationId] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(true)

  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, locRes] = await Promise.all([
          apiFetch('/api/profile'),
          apiFetch('/api/locations'),
        ])
        const [profileJson, locJson] = await Promise.all([
          profileRes.json(),
          locRes.json(),
        ])

        if (profileRes.ok) {
          const d = profileJson.data
          setName(d.name ?? '')
          setBio(d.bio ?? '')
          setLocationId(d.locationId ?? null)
          setIsPublic(d.isPublic ?? true)
        }

        if (locRes.ok) {
          setLocations((locJson.data ?? []).map((l: any) => ({
            id: l.id,
            city: l.city,
            neighborhood: l.neighborhood,
          })))
        }
      } catch {
        Alert.alert('Error', 'Could not load profile. Please try again.')
        router.back()
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        isPublic,
        locationId: locationId ?? '',   // '' = clear location
      }
      if (name.trim()) body.name = name.trim()
      if (bio.trim()) body.bio = bio.trim()

      const res = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (!res.ok) {
        const msgs: Record<string, string> = {
          VALIDATION_ERROR:   'Please check your inputs.',
          LOCATION_NOT_FOUND: 'Invalid location selected.',
          TOO_MANY_REQUESTS:  'Too many attempts. Please wait.',
        }
        Alert.alert('Could not save', msgs[json.error] ?? 'Something went wrong.')
        return
      }

      router.back()
    } catch {
      Alert.alert('Error', 'Network error. Please check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.pageTitle}>Edit profile</Text>

      {/* Name */}
      <View style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your display name"
          maxLength={100}
          returnKeyType="next"
        />
      </View>

      {/* Bio */}
      <View style={styles.field}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={bio}
          onChangeText={setBio}
          placeholder="A short description about yourself…"
          maxLength={500}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.hint}>{bio.length}/500</Text>
      </View>

      {/* Location */}
      <View style={styles.field}>
        <Text style={styles.label}>Location</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <TouchableOpacity
            style={[styles.chip, !locationId && styles.chipActive]}
            onPress={() => setLocationId(null)}
          >
            <Text style={[styles.chipText, !locationId && styles.chipTextActive]}>None</Text>
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

      {/* Visibility */}
      <View style={styles.field}>
        <Text style={styles.label}>Profile visibility</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleChip, isPublic && styles.toggleChipActive]}
            onPress={() => setIsPublic(true)}
          >
            <Text style={[styles.toggleChipText, isPublic && styles.toggleChipTextActive]}>
              Public
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleChip, !isPublic && styles.toggleChipActive]}
            onPress={() => setIsPublic(false)}
          >
            <Text style={[styles.toggleChipText, !isPublic && styles.toggleChipTextActive]}>
              Private
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          {isPublic
            ? 'Anyone can view your profile and offered skills.'
            : 'Only you can see your profile.'}
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
            : <Text style={styles.submitBtnText}>Save changes</Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  hint: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
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
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  toggleChipActive: { backgroundColor: '#15803d', borderColor: '#15803d' },
  toggleChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  toggleChipTextActive: { color: '#fff', fontWeight: '600' },
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
})