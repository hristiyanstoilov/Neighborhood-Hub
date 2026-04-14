import React from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import type { CategoryOption, LocationOption } from '../../../../lib/queries/skills'

export function SkillTitleField(props: {
  title: string
  onChangeTitle: (value: string) => void
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={styles.input}
        value={props.title}
        onChangeText={props.onChangeTitle}
        placeholder="e.g. Guitar lessons, Python tutoring…"
        maxLength={200}
        returnKeyType="next"
      />
    </View>
  )
}

export function SkillDescriptionField(props: {
  description: string
  onChangeDescription: (value: string) => void
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={props.description}
        onChangeText={props.onChangeDescription}
        placeholder="Describe what you offer, your experience…"
        maxLength={2000}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
    </View>
  )
}

export function SkillAvailableHoursField(props: {
  availableHours: string
  onChangeAvailableHours: (value: string) => void
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Hours available / week</Text>
      <TextInput
        style={[styles.input, styles.inputSmall]}
        value={props.availableHours}
        onChangeText={props.onChangeAvailableHours}
        placeholder="e.g. 5"
        keyboardType="number-pad"
        maxLength={3}
      />
    </View>
  )
}

export function SkillCategoryPicker(props: {
  categoryId: string | null
  categories: CategoryOption[]
  onChangeCategoryId: (value: string | null) => void
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        <TouchableOpacity
          style={[styles.chip, !props.categoryId && styles.chipActive]}
          onPress={() => props.onChangeCategoryId(null)}
        >
          <Text style={[styles.chipText, !props.categoryId && styles.chipTextActive]}>Any</Text>
        </TouchableOpacity>
        {props.categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.chip, props.categoryId === category.id && styles.chipActive]}
            onPress={() => props.onChangeCategoryId(category.id)}
          >
            <Text style={[styles.chipText, props.categoryId === category.id && styles.chipTextActive]}>{category.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

export function SkillLocationPicker(props: {
  locationId: string | null
  locations: LocationOption[]
  onChangeLocationId: (value: string | null) => void
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Location</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        <TouchableOpacity
          style={[styles.chip, !props.locationId && styles.chipActive]}
          onPress={() => props.onChangeLocationId(null)}
        >
          <Text style={[styles.chipText, !props.locationId && styles.chipTextActive]}>Any</Text>
        </TouchableOpacity>
        {props.locations.map((location) => (
          <TouchableOpacity
            key={location.id}
            style={[styles.chip, props.locationId === location.id && styles.chipActive]}
            onPress={() => props.onChangeLocationId(location.id)}
          >
            <Text style={[styles.chipText, props.locationId === location.id && styles.chipTextActive]}>
              {location.neighborhood}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
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
  textarea: { minHeight: 90, paddingTop: 10 },
  inputSmall: { width: 100 },
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
})