import { useCallback, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../../contexts/auth'
import { apiFetch } from '../../../lib/api'

interface ProfileData {
  name: string | null
  bio: string | null
  avatarUrl: string | null
  isPublic: boolean
  locationId: string | null
  city: string | null
  neighborhood: string | null
  email: string
  emailVerifiedAt: string | null
}

type FetchState =
  | { type: 'loading' }
  | { type: 'error' }
  | { type: 'ok'; profile: ProfileData }

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [state, setState] = useState<FetchState>({ type: 'loading' })
  const [refreshing, setRefreshing] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (result.canceled) return
    const asset = result.assets[0]
    setUploadingAvatar(true)
    try {
      const mime = asset.mimeType ?? 'image/jpeg'
      const ext = mime.split('/')[1] ?? 'jpg'
      const fd = new FormData()
      fd.append('file', { uri: asset.uri, name: `avatar.${ext}`, type: mime } as any)
      const uploadRes = await apiFetch('/api/upload', { method: 'POST', body: fd })
      const uploadJson = await uploadRes.json()
      if (!uploadRes.ok) {
        Alert.alert('Upload failed', uploadJson.detail ?? 'Only JPEG, PNG, WebP up to 5 MB.')
        return
      }
      const profileRes = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ avatarUrl: uploadJson.data.url }),
      })
      if (!profileRes.ok) {
        Alert.alert('Error', 'Could not save avatar. Please try again.')
        return
      }
      await fetchProfile()
    } catch {
      Alert.alert('Error', 'Upload failed. Please check your connection.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const fetchProfile = useCallback(async () => {
    try {
      const res = await apiFetch('/api/profile')
      if (!res.ok) {
        setState({ type: 'error' })
        return
      }
      const json = await res.json()
      const d = json.data
      setState({
        type: 'ok',
        profile: {
          name: d.name ?? null,
          bio: d.bio ?? null,
          avatarUrl: d.avatarUrl ?? null,
          isPublic: d.isPublic ?? true,
          locationId: d.locationId ?? null,
          city: d.locationCity ?? null,
          neighborhood: d.locationNeighborhood ?? null,
          email: d.email ?? '',
          emailVerifiedAt: d.emailVerifiedAt ?? null,
        },
      })
    } catch {
      setState({ type: 'error' })
    }
  }, [])

  useFocusEffect(useCallback(() => {
    fetchProfile()
  }, [fetchProfile]))

  async function handleRefresh() {
    setRefreshing(true)
    await fetchProfile()
    setRefreshing(false)
  }

  async function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Please log in to view your profile.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.btnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (state.type === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    )
  }

  if (state.type === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load profile.</Text>
        <TouchableOpacity style={styles.btn} onPress={fetchProfile}>
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const { profile } = state
  const location = profile.neighborhood
    ? `${profile.neighborhood}, ${profile.city ?? ''}`
    : profile.city ?? null
  const initials = (profile.name ?? profile.email)[0].toUpperCase()

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#15803d" />}
    >
      {/* Avatar + name */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar} style={styles.avatarWrapper}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          {uploadingAvatar ? (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <View style={styles.avatarOverlay}>
              <Text style={styles.avatarEditIcon}>✎</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.name}>{profile.name ?? 'No name set'}</Text>
        <Text style={styles.email}>{profile.email}</Text>
        {location && <Text style={styles.location}>📍 {location}</Text>}
      </View>

      {/* Verification badge */}
      <View style={[styles.badge, profile.emailVerifiedAt ? styles.badgeVerified : styles.badgeUnverified]}>
        <Text style={[styles.badgeText, profile.emailVerifiedAt ? styles.badgeTextVerified : styles.badgeTextUnverified]}>
          {profile.emailVerifiedAt ? '✓ Email verified' : '⚠ Email not verified'}
        </Text>
      </View>

      {/* Bio */}
      {profile.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.emptyBio}>No bio added yet.</Text>
        </View>
      )}

      {/* Visibility */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Profile visibility</Text>
        <Text style={styles.metaText}>
          {profile.isPublic ? 'Public — visible to other neighbors' : 'Private — only you can see it'}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(app)/profile/edit')}
        >
          <Text style={styles.primaryBtnText}>Edit profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(app)/my-skills')}
        >
          <Text style={styles.secondaryBtnText}>My Skills</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(app)/skills/new')}
        >
          <Text style={styles.secondaryBtnText}>Offer a skill</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(app)/(tabs)/my-requests')}
        >
          <Text style={styles.secondaryBtnText}>My Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerBtn} onPress={handleLogout}>
          <Text style={styles.dangerBtnText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f3f4f6',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#15803d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditIcon: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 14,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#15803d',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: '#6b7280',
  },
  badge: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 20,
    alignSelf: 'center',
  },
  badgeVerified: {
    backgroundColor: '#d1fae5',
  },
  badgeUnverified: {
    backgroundColor: '#fef3c7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextVerified: {
    color: '#065f46',
  },
  badgeTextUnverified: {
    color: '#92400e',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bioText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  emptyBio: {
    fontSize: 13,
    color: '#9ca3af',
  },
  metaText: {
    fontSize: 13,
    color: '#374151',
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  btn: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryBtnText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 14,
  },
  dangerBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  dangerBtnText: {
    color: '#dc2626',
    fontWeight: '500',
    fontSize: 14,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 12,
  },
})