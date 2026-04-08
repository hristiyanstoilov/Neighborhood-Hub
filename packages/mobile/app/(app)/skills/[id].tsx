import { useEffect, useState } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth } from '../../../contexts/auth'
import { apiFetch } from '../../../lib/api'

interface SkillDetail {
  id: string
  title: string
  description: string | null
  status: string
  availableHours: number | null
  imageUrl: string | null
  ownerId: string
  ownerName: string | null
  category: string | null
  location: string | null
}

type FetchState =
  | { type: 'loading' }
  | { type: 'not_found' }
  | { type: 'error' }
  | { type: 'ok'; skill: SkillDetail }

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  available: { bg: '#d1fae5', text: '#065f46' },
  busy: { bg: '#fef3c7', text: '#92400e' },
  retired: { bg: '#f3f4f6', text: '#6b7280' },
}

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [state, setState] = useState<FetchState>({ type: 'loading' })

  useEffect(() => {
    if (!id) return
    async function fetchSkill() {
      try {
        const res = await apiFetch(`/api/skills/${id}`)
        if (res.status === 404) {
          setState({ type: 'not_found' })
          return
        }
        if (!res.ok) {
          setState({ type: 'error' })
          return
        }
        const json = await res.json()
        const s = json.data
        setState({
          type: 'ok',
          skill: {
            id: s.id,
            title: s.title,
            description: s.description ?? null,
            status: s.status,
            availableHours: s.availableHours ?? null,
            imageUrl: s.imageUrl ?? null,
            ownerId: s.ownerId,
            ownerName: s.ownerName ?? null,
            category: s.categoryLabel ?? null,
            location: s.locationNeighborhood
              ? `${s.locationNeighborhood}, ${s.locationCity ?? ''}`
              : null,
          },
        })
      } catch {
        setState({ type: 'error' })
      }
    }
    fetchSkill()
  }, [id])

  function handleRequest() {
    if (!user) {
      Alert.alert('Login required', 'Please login to request this skill.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/(auth)/login') },
      ])
      return
    }

    if (!user.emailVerifiedAt) {
      Alert.alert(
        'Email not verified',
        'Please verify your email before requesting skills.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Resend email',
            onPress: async () => {
              try {
                const res = await apiFetch('/api/auth/resend-verification', { method: 'POST' })
                const json = await res.json()
                if (res.ok) {
                  Alert.alert('Email sent', 'Check your inbox for the verification link.')
                } else if (json.error === 'EMAIL_ALREADY_VERIFIED') {
                  Alert.alert('Already verified', 'Your email is already verified. Please reload the app.')
                } else {
                  Alert.alert('Error', 'Could not send email. Please try again.')
                }
              } catch {
                Alert.alert('Error', 'Network error. Please try again.')
              }
            },
          },
        ]
      )
      return
    }

    router.push(`/(app)/skills/request/${skill.id}`)
  }

  if (state.type === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    )
  }

  if (state.type === 'not_found') {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundTitle}>Skill not found</Text>
        <Text style={styles.notFoundSub}>This skill may have been removed.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (state.type === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load skill.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const { skill } = state
  const statusStyle = STATUS_COLORS[skill.status] ?? STATUS_COLORS.available
  const isOwner = user?.id === skill.ownerId
  const canRequest = !isOwner && skill.status === 'available'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Banner image */}
      {skill.imageUrl && (
        <Image
          source={{ uri: skill.imageUrl }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      )}

      {/* Badges */}
      <View style={styles.bodyPadding}>
      <View style={styles.badges}>
        {skill.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{skill.category}</Text>
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{skill.status}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{skill.title}</Text>

      {/* Owner */}
      {skill.ownerName && (
        <TouchableOpacity onPress={() => router.push(`/(app)/users/${skill.ownerId}`)}>
          <Text style={styles.owner}>
            Offered by <Text style={styles.ownerLink}>{skill.ownerName}</Text>
          </Text>
        </TouchableOpacity>
      )}

      {/* Location */}
      {skill.location && (
        <Text style={styles.meta}>📍 {skill.location}</Text>
      )}

      {/* Available hours */}
      {skill.availableHours != null && (
        <Text style={styles.meta}>🕐 {skill.availableHours}h available</Text>
      )}

      {/* Description */}
      {skill.description && (
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionLabel}>About this skill</Text>
          <Text style={styles.descriptionText}>{skill.description}</Text>
        </View>
      )}

      </View>

      {/* Request button */}
      <View style={styles.bodyPadding}>
      {isOwner ? (
        <View style={styles.ownerActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/(app)/skills/edit/${skill.id}`)}
          >
            <Text style={styles.editButtonText}>Edit skill</Text>
          </TouchableOpacity>
          <View style={styles.ownerNotice}>
            <Text style={styles.ownerNoticeText}>You are the owner of this listing.</Text>
          </View>
        </View>
      ) : canRequest ? (
        <TouchableOpacity
          style={styles.requestButton}
          onPress={handleRequest}
        >
          <Text style={styles.requestButtonText}>
            {user ? 'Request this skill' : 'Login to request'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.unavailableNotice}>
          <Text style={styles.unavailableText}>This skill is currently not available.</Text>
        </View>
      )}
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
    paddingBottom: 40,
  },
  bannerImage: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  bodyPadding: {
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f3f4f6',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: '#f0fdf4',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  owner: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  ownerLink: {
    color: '#15803d',
    fontWeight: '500',
  },
  meta: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  descriptionBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  requestButton: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  requestButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  ownerActions: {
    marginTop: 24,
    gap: 10,
  },
  editButton: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  ownerNotice: {
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 14,
    marginTop: 24,
    alignItems: 'center',
  },
  ownerNoticeText: {
    color: '#0369a1',
    fontSize: 13,
  },
  unavailableNotice: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    marginTop: 24,
    alignItems: 'center',
  },
  unavailableText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  notFoundSub: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#15803d',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
})
