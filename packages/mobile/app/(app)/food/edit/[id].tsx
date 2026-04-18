import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../../lib/api'
import { fetchFoodDetail, foodKeys } from '../../../../lib/queries/food'
import { useToast } from '../../../../lib/toast'

export default function EditFoodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const foodQuery = useQuery({
    queryKey: foodKeys.detail(id ?? ''),
    queryFn: () => fetchFoodDetail(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  })

  const food = foodQuery.data
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [pickupInstructions, setPickupInstructions] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    if (!food) return
    setTitle(food.title)
    setDescription(food.description ?? '')
    setQuantity(String(food.quantity))
    setPickupInstructions(food.pickupInstructions ?? '')
    setImageUrl(food.imageUrl ?? '')
  }, [food])

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/food-shares/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          quantity: parseInt(quantity, 10) || 1,
          pickupInstructions: pickupInstructions.trim() || null,
          imageUrl: imageUrl.trim() || null,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      return json.data
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: foodKeys.all })
      showToast({ message: 'Listing updated.', variant: 'success' })
      router.replace(`/(app)/food/${data.id}`)
    },
    onError: (err) => {
      Alert.alert('Could not save listing', err.message === 'VALIDATION_ERROR' ? 'Please check the form fields.' : 'Something went wrong.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/food-shares/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      return json.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: foodKeys.all })
      showToast({ message: 'Listing deleted.', variant: 'success' })
      router.replace('/(app)/food')
    },
    onError: () => {
      Alert.alert('Could not delete listing', 'Something went wrong.')
    },
  })

  if (foodQuery.isLoading) {
    return <View style={styles.center}><ActivityIndicator color="#15803d" size="large" /></View>
  }

  if (foodQuery.isError || !food) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load this food listing.</Text>
        <TouchableOpacity onPress={() => void foodQuery.refetch()} style={styles.retryBtn}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
      </View>
    )
  }

  function handleDelete() {
    Alert.alert('Delete listing', 'Are you sure you want to delete this food listing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ])
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Edit Food Listing</Text>

      <Field label="Title" required>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} maxLength={200} />
      </Field>
      <Field label="Description">
        <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" maxLength={5000} />
      </Field>
      <Field label="Quantity" required>
        <TextInput style={[styles.input, styles.quantityInput]} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
      </Field>
      <Field label="Pickup instructions">
        <TextInput style={[styles.input, styles.textarea]} value={pickupInstructions} onChangeText={setPickupInstructions} multiline numberOfLines={4} textAlignVertical="top" maxLength={500} />
      </Field>
      <Field label="Image URL">
        <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" />
      </Field>

      <TouchableOpacity style={[styles.primaryBtn, updateMutation.isPending && styles.disabledBtn]} onPress={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
        {updateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save changes</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={handleDelete} disabled={deleteMutation.isPending}>
        {deleteMutation.isPending ? <ActivityIndicator color="#dc2626" /> : <Text style={styles.secondaryBtnText}>Delete listing</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 6 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: '#111827' },
  textarea: { minHeight: 96 },
  quantityInput: { maxWidth: 120 },
  primaryBtn: { backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
  disabledBtn: { opacity: 0.6 },
  backBtn: { alignItems: 'center', paddingVertical: 8 },
  backBtnText: { color: '#6b7280', fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  errorText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 8, backgroundColor: '#15803d' },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
})