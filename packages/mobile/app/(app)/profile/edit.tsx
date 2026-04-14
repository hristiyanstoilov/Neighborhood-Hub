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
} from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchOwnProfile,
  fetchProfileLocations,
  profileKeys,
  profileUpdateErrorMessage,
  updateOwnProfile,
} from '../../../lib/queries/profile'
import { useToast } from '../../../lib/toast'

export default function EditProfileScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [locationId, setLocationId] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const hydratedFromQuery = useRef(false)

  const profileQuery = useQuery({
    queryKey: profileKeys.me(),
    queryFn: fetchOwnProfile,
  })

  const locationsQuery = useQuery({
    queryKey: profileKeys.locations(),
    queryFn: fetchProfileLocations,
  })

  const updateMutation = useMutation({
    mutationFn: updateOwnProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.all })
      showToast({ message: 'Profile saved', variant: 'success' })
      router.back()
    },
  })

  useEffect(() => {
    if (!profileQuery.data || hydratedFromQuery.current) return

    setName(profileQuery.data.name ?? '')
    setBio(profileQuery.data.bio ?? '')
    setLocationId(profileQuery.data.locationId ?? null)
    setIsPublic(profileQuery.data.isPublic ?? true)
    hydratedFromQuery.current = true
  }, [profileQuery.data])

  async function handleSubmit() {
    try {
      await updateMutation.mutateAsync({
        name,
        bio,
        locationId,
        isPublic,
      })
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      Alert.alert('Could not save', profileUpdateErrorMessage(code))
    }
  }

  const loading = profileQuery.isLoading || locationsQuery.isLoading
  const loadError = profileQuery.isError || locationsQuery.isError
  const locations = locationsQuery.data ?? []
  const submitting = updateMutation.isPending

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    )
  }

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load profile. Please try again.</Text>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => {
            void profileQuery.refetch()
            void locationsQuery.refetch()
          }}
        >
          <Text style={styles.submitBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Go back</Text>
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
  errorText: { fontSize: 14, color: '#dc2626', marginBottom: 10 },
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