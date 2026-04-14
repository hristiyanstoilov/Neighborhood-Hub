import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import { apiFetch } from '../../../lib/api'
import { mySkillsKeys } from '../../../lib/queries/my-skills'
import { fetchCategories, fetchLocations, skillsKeys } from '../../../lib/queries/skills'
import {
  SkillAvailableHoursField,
  SkillCategoryPicker,
  SkillDescriptionField,
  SkillLocationPicker,
  SkillTitleField,
} from './_components/skill-form-core'

function readErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }

  return 'UNKNOWN_ERROR'
}

export default function NewSkillScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [availableHours, setAvailableHours] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState<string | null>(null)

  const categoriesQuery = useQuery({
    queryKey: skillsKeys.categories(),
    queryFn: fetchCategories,
    enabled: Boolean(user),
  })

  const locationsQuery = useQuery({
    queryKey: skillsKeys.locations(),
    queryFn: fetchLocations,
    enabled: Boolean(user),
  })

  const createSkillMutation = useMutation({
    mutationFn: async () => {
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
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(readErrorCode(json))
      }

      return json?.data?.id as string
    },
    onSuccess: async (skillId) => {
      await queryClient.invalidateQueries({ queryKey: skillsKeys.all })
      await queryClient.invalidateQueries({ queryKey: mySkillsKeys.all })
      router.replace(`/(app)/skills/${skillId}`)
    },
  })

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
      await createSkillMutation.mutateAsync()
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      const msgs: Record<string, string> = {
        UNVERIFIED_EMAIL: 'Please verify your email before offering a skill.',
        VALIDATION_ERROR: 'Please check your inputs.',
        TOO_MANY_REQUESTS: 'Too many attempts. Please wait and try again.',
        UNAUTHORIZED: 'You must be logged in to offer a skill.',
      }
      Alert.alert('Could not publish', msgs[code] ?? 'Something went wrong.')
    }
  }

  const loadingData = categoriesQuery.isLoading || locationsQuery.isLoading
  const loadingError = categoriesQuery.isError || locationsQuery.isError
  const categories = categoriesQuery.data ?? []
  const locations = locationsQuery.data ?? []
  const submitting = createSkillMutation.isPending

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

  if (loadingError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load form data. Please try again.</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
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
      <Text style={styles.pageTitle}>Offer a skill</Text>
      <SkillTitleField title={title} onChangeTitle={setTitle} />
      <SkillDescriptionField description={description} onChangeDescription={setDescription} />
      <SkillAvailableHoursField availableHours={availableHours} onChangeAvailableHours={setAvailableHours} />
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