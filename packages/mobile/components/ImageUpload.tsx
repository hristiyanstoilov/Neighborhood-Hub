import { useState } from 'react'
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { apiFetch } from '../lib/api'
import { mobileTheme } from '../lib/theme'

type Props = {
  value: string
  onChange: (url: string) => void
}

export function ImageUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)

  async function pickAndUpload() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    })
    if (result.canceled) return

    const asset = result.assets[0]
    const mime = asset.mimeType ?? 'image/jpeg'
    const ext = mime.split('/')[1] ?? 'jpg'

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', { uri: asset.uri, name: `food.${ext}`, type: mime } as any)
      const res = await apiFetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        Alert.alert('Upload failed', json?.detail ?? 'Only JPEG, PNG, WebP up to 5 MB.')
        return
      }
      onChange(json.data.url)
    } catch {
      Alert.alert('Upload failed', 'Could not upload image.')
    } finally {
      setUploading(false)
    }
  }

  if (value) {
    return (
      <View style={styles.preview}>
        <Image source={{ uri: value }} style={styles.image} resizeMode="cover" />
        <View style={styles.previewActions}>
          <TouchableOpacity onPress={pickAndUpload} disabled={uploading}>
            <Text style={styles.replaceText}>{uploading ? 'Uploading…' : 'Replace image'}</Text>
          </TouchableOpacity>
          <Text style={styles.separator}> | </Text>
          <TouchableOpacity onPress={() => onChange('')}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
        {uploading && <ActivityIndicator style={styles.spinner} color={mobileTheme.colors.primary} />}
      </View>
    )
  }

  return (
    <TouchableOpacity style={styles.uploadBtn} onPress={pickAndUpload} disabled={uploading}>
      {uploading
        ? <ActivityIndicator color={mobileTheme.colors.primary} />
        : <Text style={styles.uploadBtnText}>+ Upload image</Text>}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  uploadBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: mobileTheme.colors.border,
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: mobileTheme.colors.surface,
  },
  uploadBtnText: {
    fontSize: 14,
    color: mobileTheme.colors.textMuted,
  },
  preview: {
    gap: 8,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderSoft,
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replaceText: {
    fontSize: 12,
    color: mobileTheme.colors.primary,
  },
  separator: {
    fontSize: 12,
    color: mobileTheme.colors.textSubtle,
  },
  removeText: {
    fontSize: 12,
    color: mobileTheme.colors.textMuted,
  },
  spinner: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
  },
})
