import type { ReactNode } from 'react'
import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../lib/api'
import { foodKeys } from '../../../lib/queries/food'
import { useToast } from '../../../lib/toast'

export default function NewFoodScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [pickupInstructions, setPickupInstructions] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/food-shares', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          quantity: parseInt(quantity, 10) || 1,
          pickupInstructions: pickupInstructions.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      return json.data
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: foodKeys.all })
      showToast({ message: 'Food share created!', variant: 'success' })
      router.replace(`/(app)/food/${data.id}`)
    },
    onError: (err) => {
      const messages: Record<string, string> = {
        VALIDATION_ERROR: 'Please check the form fields.',
        UNVERIFIED_EMAIL: 'Please verify your email before sharing food.',
      }
      Alert.alert('Could not create listing', messages[err.message] ?? 'Something went wrong.')
    },
  })

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Share Food</Text>

      <Field label="Title" required>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Homemade soup" maxLength={200} />
      </Field>

      <Field label="Description">
        <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} placeholder="What are you sharing?" maxLength={5000} multiline numberOfLines={4} textAlignVertical="top" />
      </Field>

      <Field label="Quantity" required>
        <TextInput style={[styles.input, styles.quantityInput]} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="1" />
      </Field>

      <Field label="Pickup instructions">
        <TextInput style={[styles.input, styles.textarea]} value={pickupInstructions} onChangeText={setPickupInstructions} placeholder="Pickup time, contact, access code…" maxLength={500} multiline numberOfLines={4} textAlignVertical="top" />
      </Field>

      <Field label="Image URL">
        <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} placeholder="https://…" maxLength={2048} autoCapitalize="none" />
      </Field>

      <TouchableOpacity style={[styles.primaryBtn, createMutation.isPending && styles.primaryBtnDisabled]} onPress={() => createMutation.mutate()} disabled={createMutation.isPending || !title.trim() || !quantity.trim()}>
        {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create listing</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
        <Text style={styles.secondaryBtnText}>Cancel</Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  kav: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 6 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: '#111827' },
  textarea: { minHeight: 96 },
  quantityInput: { maxWidth: 120 },
  primaryBtn: { backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { color: '#374151', fontSize: 15, fontWeight: '600' },
})