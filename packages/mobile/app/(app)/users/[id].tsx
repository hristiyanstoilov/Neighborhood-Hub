import { useMemo } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import {
  asPublicProfileErrorCode,
  fetchPublicProfileById,
  publicProfileKeys,
} from '../../../lib/queries/public-profile'

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const userId = typeof id === 'string' ? id : ''

  const profileQuery = useQuery({
    queryKey: publicProfileKeys.detail(userId),
    queryFn: () => fetchPublicProfileById(userId),
    enabled: userId.length > 0,
  })

  const errorCode = useMemo(() => {
    if (!profileQuery.isError) return null
    const message = profileQuery.error instanceof Error ? profileQuery.error.message : 'FETCH_FAILED'
    return asPublicProfileErrorCode(message)
  }, [profileQuery.error, profileQuery.isError])

  if (profileQuery.isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#15803d" /></View>
  }

  if (errorCode === 'PROFILE_NOT_FOUND') {
    return (
      <View style={styles.center}>
        <Text style={styles.bigIcon}>👤</Text>
        <Text style={styles.title}>Profile not found</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (errorCode === 'PROFILE_PRIVATE') {
    return (
      <View style={styles.center}>
        <Text style={styles.bigIcon}>🔒</Text>
        <Text style={styles.title}>Private profile</Text>
        <Text style={styles.subtitle}>This neighbor has set their profile to private.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load profile.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => void profileQuery.refetch()}>
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const profile = profileQuery.data
  const initials = (profile.name ?? '?')[0].toUpperCase()

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile header */}
      <View style={styles.header}>
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{initials}</Text>
          </View>
        )}
        <Text style={styles.name}>{profile.name ?? 'Neighbor'}</Text>
        {profile.location && <Text style={styles.location}>📍 {profile.location}</Text>}
        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      </View>

      {/* Skills */}
      <Text style={styles.sectionTitle}>
        Skills offered{profile.skills.length > 0 ? ` (${profile.skills.length})` : ''}
      </Text>

      {profile.skills.length === 0 ? (
        <Text style={styles.emptyText}>No available skills at the moment.</Text>
      ) : (
        profile.skills.map((skill) => (
          <TouchableOpacity
            key={skill.id}
            style={styles.skillCard}
            onPress={() => router.push(`/(app)/skills/${skill.id}`)}
          >
            {skill.imageUrl && (
              <Image source={{ uri: skill.imageUrl }} style={styles.skillImage} resizeMode="cover" />
            )}
            <View style={styles.skillBody}>
              <Text style={styles.skillTitle} numberOfLines={1}>{skill.title}</Text>
              {skill.categoryLabel && (
                <Text style={styles.skillCategory}>{skill.categoryLabel}</Text>
              )}
            </View>
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>available</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f3f4f6', gap: 8 },
  bigIcon: { fontSize: 40 },
  title: { fontSize: 17, fontWeight: '600', color: '#374151', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#9ca3af', textAlign: 'center', maxWidth: 260 },
  errorText: { fontSize: 14, color: '#dc2626', marginBottom: 4 },
  btn: { backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24, marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  header: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 72, height: 72, borderRadius: 36, marginBottom: 12 },
  avatarPlaceholder: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarInitial: { fontSize: 28, fontWeight: '700', color: '#15803d' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  location: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  bio: { fontSize: 14, color: '#374151', lineHeight: 22, textAlign: 'center', marginTop: 8, maxWidth: 300 },

  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 12 },
  emptyText: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 16 },

  skillCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillImage: { width: 64, height: 64 },
  skillBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  skillTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  skillCategory: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  availableBadge: {
    backgroundColor: '#d1fae5', borderRadius: 99,
    paddingHorizontal: 8, paddingVertical: 3, marginRight: 12,
  },
  availableBadgeText: { fontSize: 11, color: '#065f46', fontWeight: '600' },
})