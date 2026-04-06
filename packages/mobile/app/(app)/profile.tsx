import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../contexts/auth'
import { apiFetch } from '../../lib/api'

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

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

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
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
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
          style={styles.secondaryBtn}
          onPress={() => router.push('/(app)/my-requests')}
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
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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