import { useMutation, useQuery } from '@tanstack/react-query'
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth } from '../../../contexts/auth'
import { apiFetch } from '../../../lib/api'
import {
  fetchSkillDetail,
  skillDetailKeys,
  SkillNotFoundError,
} from '../../../lib/queries/skill-detail'
import {
  SkillDetailErrorState,
  SkillDetailLoadingState,
  SkillDetailNotFoundState,
} from './_components/skill-detail-states'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  available: { bg: '#d1fae5', text: '#065f46' },
  busy: { bg: '#fef3c7', text: '#92400e' },
  retired: { bg: '#f3f4f6', text: '#6b7280' },
}

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()

  const skillQuery = useQuery({
    queryKey: skillDetailKeys.detail(id ?? ''),
    queryFn: () => fetchSkillDetail(id as string),
    enabled: Boolean(id),
  })

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/auth/resend-verification', { method: 'POST' })
      const json = await res.json().catch(() => null)
      return { res, json }
    },
  })

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
                const { res, json } = await resendVerificationMutation.mutateAsync()
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

    router.push(`/(app)/skills/request/${skillQuery.data?.id}`)
  }

  if (skillQuery.isLoading) {
    return <SkillDetailLoadingState />
  }

  if (skillQuery.error instanceof SkillNotFoundError) {
    return <SkillDetailNotFoundState onBack={() => router.back()} />
  }

  if (skillQuery.isError || !skillQuery.data) {
    return <SkillDetailErrorState onBack={() => router.back()} />
  }

  const skill = skillQuery.data
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
