import { useEffect, useRef, useState } from 'react'
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../../contexts/auth'
import { apiFetch } from '../../../../lib/api'
import { mySkillsKeys } from '../../../../lib/queries/my-skills'
import { SkillNotFoundError, fetchSkillDetail, skillDetailKeys } from '../../../../lib/queries/skill-detail'
import { fetchCategories, fetchLocations, skillsKeys } from '../../../../lib/queries/skills'
import { useToast } from '../../../../lib/toast'
import {
  SkillAvailableHoursField,
  SkillCategoryPicker,
  SkillDescriptionField,
  SkillLocationPicker,
  SkillTitleField,
} from '../_components/skill-form-core'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'retired', label: 'Retired' },
]

export default function EditSkillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const skillId = typeof id === 'string' ? id : ''
  const hydratedFromQuery = useRef(false)
  const ownershipChecked = useRef(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [availableHours, setAvailableHours] = useState('')
  const [status, setStatus] = useState('available')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const skillQuery = useQuery({
    queryKey: skillDetailKeys.detail(skillId),
    queryFn: () => fetchSkillDetail(skillId),
    enabled: skillId.length > 0 && !authLoading,
  })

  const categoriesQuery = useQuery({
    queryKey: skillsKeys.categories(),
    queryFn: fetchCategories,
    enabled: Boolean(user && !authLoading),
  })

  const locationsQuery = useQuery({
    queryKey: skillsKeys.locations(),
    queryFn: fetchLocations,
    enabled: Boolean(user && !authLoading),
  })

  const updateSkillMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        title: title.trim(),
        status,
        imageUrl,
      }

      if (description.trim()) body.description = description.trim()
      if (categoryId) body.categoryId = categoryId
      if (locationId) body.locationId = locationId

      const hours = parseInt(availableHours, 10)
      if (!isNaN(hours) && hours >= 0 && hours <= 168) body.availableHours = hours

      const res = await apiFetch(`/api/skills/${skillId}`, {
        method: 'PUT',
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
      await queryClient.invalidateQueries({ queryKey: skillDetailKeys.detail(skillId) })
      await queryClient.invalidateQueries({ queryKey: skillsKeys.all })
      await queryClient.invalidateQueries({ queryKey: mySkillsKeys.all })
      showToast({ message: 'Skill saved', variant: 'success' })
      router.replace(`/(app)/skills/${skillId}`)
    },
  })

  const deleteSkillMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/skills/${skillId}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const code = json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string'
          ? (json as { error: string }).error
          : 'UNKNOWN_ERROR'
        throw new Error(code)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: skillsKeys.all })
      await queryClient.invalidateQueries({ queryKey: mySkillsKeys.all })
      showToast({ message: 'Skill deleted', variant: 'success' })
      router.replace('/(app)/')
    },
  })

  useEffect(() => {
    if (!skillQuery.data || hydratedFromQuery.current) return

    setTitle(skillQuery.data.title ?? '')
    setDescription(skillQuery.data.description ?? '')
    setAvailableHours(skillQuery.data.availableHours != null ? String(skillQuery.data.availableHours) : '')
    setStatus(skillQuery.data.status ?? 'available')
    setCategoryId(skillQuery.data.categoryId ?? null)
    setLocationId(skillQuery.data.locationId ?? null)
    setImageUrl(skillQuery.data.imageUrl ?? null)
    hydratedFromQuery.current = true
  }, [skillQuery.data])

  useEffect(() => {
    if (!skillQuery.data || !user || ownershipChecked.current) return
    if (skillQuery.data.ownerId !== user.id) {
      ownershipChecked.current = true
      Alert.alert('Unauthorized', 'You can only edit your own skills.')
      router.back()
    }
  }, [router, skillQuery.data, user])

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

    try {
      await updateSkillMutation.mutateAsync()
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      const msgs: Record<string, string> = {
        VALIDATION_ERROR: 'Please check your inputs.',
        TOO_MANY_REQUESTS: 'Too many attempts. Please wait and try again.',
        NOT_FOUND: 'Skill not found.',
      }
      Alert.alert('Could not save', msgs[code] ?? 'Something went wrong.')
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
              await deleteSkillMutation.mutateAsync()
            } catch {
              Alert.alert('Error', 'Network error. Please try again.')
            }
          },
        },
      ]
    )
  }

  const loadingData = skillQuery.isLoading || categoriesQuery.isLoading || locationsQuery.isLoading
  const loadError = skillQuery.isError && !(skillQuery.error instanceof SkillNotFoundError)
  const notFound = skillQuery.error instanceof SkillNotFoundError
  const categories = categoriesQuery.data ?? []
  const locations = locationsQuery.data ?? []
  const submitting = updateSkillMutation.isPending

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

  if (loadError || categoriesQuery.isError || locationsQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load skill. Please try again.</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
            void skillQuery.refetch()
            void categoriesQuery.refetch()
            void locationsQuery.refetch()
          }}
        >
          <Text style={styles.btnText}>Retry</Text>
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

      <SkillTitleField title={title} onChangeTitle={setTitle} />
      <SkillDescriptionField description={description} onChangeDescription={setDescription} />
      <SkillAvailableHoursField availableHours={availableHours} onChangeAvailableHours={setAvailableHours} />

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

      <SkillCategoryPicker categoryId={categoryId} categories={categories} onChangeCategoryId={setCategoryId} />
      <SkillLocationPicker locationId={locationId} locations={locations} onChangeLocationId={setLocationId} />

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