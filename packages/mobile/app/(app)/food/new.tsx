import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native'
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../lib/api'
import { foodKeys } from '../../../lib/queries/food'
import { fetchProfileLocations, profileKeys } from '../../../lib/queries/profile'
import { useToast } from '../../../lib/toast'
import { mobileTheme } from '../../../lib/theme'
import { formatDateTime } from '../../../lib/format'
import { ImageUpload } from '../../../components/ImageUpload'

export default function NewFoodScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [locationId, setLocationId] = useState<string | null>(null)
  const [availableUntil, setAvailableUntil] = useState<Date | null>(null)
  const [showIosPicker, setShowIosPicker] = useState(false)
  const [pickupInstructions, setPickupInstructions] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  const locationsQuery = useQuery({
    queryKey: profileKeys.locations(),
    queryFn: fetchProfileLocations,
  })
  const locations = locationsQuery.data ?? []

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/food-shares', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          quantity: parseInt(quantity, 10) || 1,
          locationId: locationId ?? undefined,
          availableUntil: availableUntil ? availableUntil.toISOString() : undefined,
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

  function onDateChange(event: DateTimePickerEvent, selected?: Date) {
    if (selected) setAvailableUntil(selected)
  }

  function openDatePicker() {
    const now = new Date()
    const value = availableUntil ?? new Date(now.getTime() + 24 * 60 * 60 * 1000)

    if (Platform.OS === 'android') {
      const updateDatePart = (base: Date, picked: Date) => {
        const next = new Date(base)
        next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate())
        return next
      }
      const updateTimePart = (base: Date, picked: Date) => {
        const next = new Date(base)
        next.setHours(picked.getHours(), picked.getMinutes(), 0, 0)
        return next
      }

      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        minimumDate: now,
        is24Hour: true,
        onChange: (dateEvent, dateSelected) => {
          if (dateEvent.type !== 'set' || !dateSelected) return
          const withDay = updateDatePart(value, dateSelected)
          DateTimePickerAndroid.open({
            value: withDay,
            mode: 'time',
            is24Hour: true,
            onChange: (timeEvent, timeSelected) => {
              if (timeEvent.type !== 'set' || !timeSelected) return
              setAvailableUntil(updateTimePart(withDay, timeSelected))
            },
          })
        },
      })
      return
    }

    setShowIosPicker((v) => !v)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

      <Field label="Neighborhood">
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
      </Field>

      <Field label="Available until">
        <TouchableOpacity style={styles.dateBtn} onPress={openDatePicker}>
          <Text style={availableUntil ? styles.dateBtnValue : styles.dateBtnPlaceholder}>
            {availableUntil ? formatDateTime(availableUntil.toISOString()) : 'Select date and time (optional)'}
          </Text>
        </TouchableOpacity>
        {Platform.OS === 'ios' && showIosPicker && (
          <View style={styles.iosPickerWrap}>
            <DateTimePicker
              value={availableUntil ?? new Date(Date.now() + 24 * 60 * 60 * 1000)}
              mode="datetime"
              minimumDate={new Date()}
              onChange={onDateChange}
              minuteInterval={5}
            />
          </View>
        )}
        {availableUntil && (
          <TouchableOpacity onPress={() => setAvailableUntil(null)}>
            <Text style={styles.clearDate}>Clear date</Text>
          </TouchableOpacity>
        )}
      </Field>

      <Field label="Pickup instructions">
        <TextInput style={[styles.input, styles.textarea]} value={pickupInstructions} onChangeText={setPickupInstructions} placeholder="Pickup time, contact, access code…" maxLength={500} multiline numberOfLines={4} textAlignVertical="top" />
      </Field>

      <Field label="Image">
        <ImageUpload value={imageUrl} onChange={setImageUrl} />
      </Field>

      <TouchableOpacity
        style={[styles.primaryBtn, createMutation.isPending && styles.primaryBtnDisabled]}
        onPress={() => createMutation.mutate()}
        disabled={createMutation.isPending || !title.trim() || !quantity.trim()}
      >
        {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create listing</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
        <Text style={styles.secondaryBtnText}>Cancel</Text>
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
  container: { flex: 1, backgroundColor: mobileTheme.colors.canvasAlt },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: mobileTheme.colors.textPrimary, marginBottom: 6 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: mobileTheme.colors.textSecondary },
  input: { backgroundColor: mobileTheme.colors.surface, borderWidth: 1, borderColor: mobileTheme.colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: mobileTheme.colors.textPrimary },
  textarea: { minHeight: 96 },
  quantityInput: { maxWidth: 120 },

  chipScroll: { flexGrow: 0 },
  chip: { borderWidth: 1, borderColor: mobileTheme.colors.border, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, backgroundColor: mobileTheme.colors.surface },
  chipActive: { backgroundColor: mobileTheme.colors.primary, borderColor: mobileTheme.colors.primary },
  chipText: { fontSize: 13, color: mobileTheme.colors.textSecondary },
  chipTextActive: { color: mobileTheme.colors.onPrimary, fontWeight: '600' },

  dateBtn: { backgroundColor: mobileTheme.colors.surface, borderWidth: 1, borderColor: mobileTheme.colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  dateBtnValue: { fontSize: 14, color: mobileTheme.colors.textPrimary },
  dateBtnPlaceholder: { fontSize: 14, color: mobileTheme.colors.textSubtle },
  iosPickerWrap: { backgroundColor: mobileTheme.colors.surface, borderRadius: 10, overflow: 'hidden', marginTop: 4 },
  clearDate: { fontSize: 12, color: mobileTheme.colors.textMuted, marginTop: 4 },

  primaryBtn: { backgroundColor: mobileTheme.colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: mobileTheme.colors.onPrimary, fontSize: 15, fontWeight: '700' },
  secondaryBtn: { borderWidth: 1, borderColor: mobileTheme.colors.border, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { color: mobileTheme.colors.textSecondary, fontSize: 15, fontWeight: '600' },
})
