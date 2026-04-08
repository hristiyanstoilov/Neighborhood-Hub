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
  Image,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../../../contexts/auth'
import { apiFetch } from '../../../../lib/api'

interface Category { id: string; slug: string; label: string }
interface Location { id: string; city: string; neighborhood: string }

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'retired', label: 'Retired' },
]

export default function EditSkillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [availableHours, setAvailableHours] = useState('')
  const [status, setStatus] = useState('available')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id || authLoading) return
    async function loadData() {
      try {
        const [skillRes, catRes, locRes] = await Promise.all([
          apiFetch(`/api/skills/${id}`),
          apiFetch('/api/categories'),
          apiFetch('/api/locations'),
        ])

        if (skillRes.status === 404) { setNotFound(true); return }
        if (!skillRes.ok) {
          Alert.alert('Error', 'Could not load skill. Please try again.')
          router.back()
          return
        }

        const [skillJson, catJson, locJson] = await Promise.all([
          skillRes.json(),
          catRes.json(),
          locRes.json(),
        ])

        const s = skillJson.data
        // Guard: only the owner can edit
        if (user?.id !== s.ownerId) {
          Alert.alert('Unauthorized', 'You can only edit your own skills.')
          router.back()
          return
        }

        setTitle(s.title ?? '')
        setDescription(s.description ?? '')
        setAvailableHours(s.availableHours != null ? String(s.availableHours) : '')
        setStatus(s.status ?? 'available')
        setCategoryId(s.categoryId ?? null)
        setLocationId(s.locationId ?? null)
        setImageUrl(s.imageUrl ?? null)

        setCategories(catJson.data ?? [])
        setLocations((locJson.data ?? []).map((l: any) => ({
          id: l.id,
          city: l.city,
          neighborhood: l.neighborhood,
        })))
      } catch {
        Alert.alert('Error', 'Network error. Please try again.')
        router.back()
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [id, user, authLoading])

  async function handleImageChange() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })
    if (result.canceled) return
    const asset = result.assets[0]
    setUploadingImage(true)
    try {
      const mime = asset.mimeType ?? 'image/jpeg'
      const ext = mime.split('/')[1] ?? 'jpg'
      const fd = new FormData()
      fd.append('file', { uri: asset.uri, name: `skill.${ext}`, type: mime } as any)
      const uploadRes = await apiFetch('/api/upload', { method: 'POST', body: fd })
      const uploadJson = await uploadRes.json()
      if (!uploadRes.ok) {
        Alert.alert('Upload failed', uploadJson.detail ?? 'Only JPEG, PNG, WebP up to 5 MB.')
        return
      }
      setImageUrl(uploadJson.data.url)
    } catch {
      Alert.alert('Error', 'Upload failed. Please check your connection.')
    } finally {
      setUploadingImage(false)
    }
  }

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
        status,
      }
      if (description.trim()) body.description = description.trim()
      if (categoryId) body.categoryId = categoryId
      if (locationId) body.locationId = locationId
      body.imageUrl = imageUrl  // null clears the image, string sets it
      const hours = parseInt(availableHours, 10)
      if (!isNaN(hours) && hours >= 0 && hours <= 168) body.availableHours = hours

      const res = await apiFetch(`/api/skills/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (!res.ok) {
        const msgs: Record<string, string> = {
          VALIDATION_ERROR: 'Please check your inputs.',
          TOO_MANY_REQUESTS: 'Too many attempts. Please wait and try again.',
          NOT_FOUND: 'Skill not found.',
        }
        Alert.alert('Could not save', msgs[json.error] ?? 'Something went wrong.')
        return
      }

      router.replace(`/(app)/skills/${id}`)
    } catch {
      Alert.alert('Error', 'Network error. Please check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    Alert.alert(
      'Delete skill',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiFetch(`/api/skills/${id}`, { method: 'DELETE' })
              if (res.ok) {
                router.replace('/(app)/')
              } else {
                Alert.alert('Error', 'Could not delete skill. Please try again.')
              }
            } catch {
              Alert.alert('Error', 'Network error. Please try again.')
            }
          },
        },
      ]
    )
  }

  if (authLoading || (!user && loadingData)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    )
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>You must be logged in.</Text>
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

  if (notFound) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Skill not found.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>Edit skill</Text>

      {/* Image */}
      <View style={styles.field}>
        <Text style={styles.label}>Cover image</Text>
        <TouchableOpacity
          style={styles.imagePicker}
          onPress={handleImageChange}
          disabled={uploadingImage}
        >
          {uploadingImage ? (
            <ActivityIndicator color="#15803d" />
          ) : imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <Text style={styles.imagePickerText}>Tap to upload image</Text>
          )}
        </TouchableOpacity>
        {imageUrl && !uploadingImage && (
          <TouchableOpacity onPress={() => setImageUrl(null)} style={styles.removeImageBtn}>
            <Text style={styles.removeImageText}>Remove image</Text>
          </TouchableOpacity>
        )}
      </View>

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

      {/* Status picker */}
      <View style={styles.field}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.statusChip, status === opt.value && styles.statusChipActive]}
              onPress={() => setStatus(opt.value)}
            >
              <Text style={[styles.statusChipText, status === opt.value && styles.statusChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
            : <Text style={styles.submitBtnText}>Save changes</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete skill</Text>
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
  statusRow: { flexDirection: 'row', gap: 8 },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  statusChipActive: { backgroundColor: '#15803d', borderColor: '#15803d' },
  statusChipText: { fontSize: 13, color: '#374151' },
  statusChipTextActive: { color: '#fff', fontWeight: '600' },
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
  deleteBtn: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fff5f5',
  },
  deleteBtnText: { color: '#dc2626', fontWeight: '500', fontSize: 14 },
  btn: { backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24, marginTop: 12 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  errorText: { color: '#dc2626', fontSize: 14, marginBottom: 12 },
  imagePicker: {
    height: 140,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePickerText: { fontSize: 13, color: '#9ca3af' },
  removeImageBtn: { marginTop: 6, alignSelf: 'flex-end' },
  removeImageText: { fontSize: 12, color: '#dc2626' },
})