import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native'

export interface ProfileTabViewModel {
  name: string | null
  bio: string | null
  avatarUrl: string | null
  isPublic: boolean
  email: string
  emailVerifiedAt: string | null
  locationCity: string | null
  locationNeighborhood: string | null
}

export function ProfileHeader(props: {
  profile: ProfileTabViewModel
  uploadingAvatar: boolean
  onPickAvatar: () => void
}) {
  const { profile } = props
  const location = profile.locationNeighborhood
    ? `${profile.locationNeighborhood}, ${profile.locationCity ?? ''}`
    : profile.locationCity ?? null
  const initials = (profile.name ?? profile.email)[0].toUpperCase()

  return (
    <View style={styles.avatarSection}>
      <TouchableOpacity onPress={props.onPickAvatar} disabled={props.uploadingAvatar} style={styles.avatarWrapper}>
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.avatarOverlay}>
          {props.uploadingAvatar ? <ActivityIndicator color="#fff" /> : <Text style={styles.avatarEditIcon}>✎</Text>}
        </View>
      </TouchableOpacity>
      <Text style={styles.name}>{profile.name ?? 'No name set'}</Text>
      <Text style={styles.email}>{profile.email}</Text>
      {location && <Text style={styles.location}>📍 {location}</Text>}
    </View>
  )
}

export function ProfileVerificationBadge(props: { verified: boolean }) {
  return (
    <View style={[styles.badge, props.verified ? styles.badgeVerified : styles.badgeUnverified]}>
      <Text style={[styles.badgeText, props.verified ? styles.badgeTextVerified : styles.badgeTextUnverified]}>
        {props.verified ? '✓ Email verified' : '⚠ Email not verified'}
      </Text>
    </View>
  )
}

export function ProfileBioSection(props: { bio: string | null }) {
  return props.bio ? (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>About</Text>
      <Text style={styles.bioText}>{props.bio}</Text>
    </View>
  ) : (
    <View style={styles.section}>
      <Text style={styles.emptyBio}>No bio added yet.</Text>
    </View>
  )
}

export function ProfileVisibilitySection(props: { isPublic: boolean }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Profile visibility</Text>
      <Text style={styles.metaText}>
        {props.isPublic ? 'Public — visible to other neighbors' : 'Private — only you can see it'}
      </Text>
    </View>
  )
}

export function ProfileActions(props: {
  onEditProfile: () => void
  onMySkills: () => void
  onOfferSkill: () => void
  onMyRequests: () => void
  onMyToolReservations: () => void
  onMyFoodReservations: () => void
  onMyEvents: () => void
  onMyPledges: () => void
  onLogout: () => void
}) {
  return (
    <View style={styles.actions}>
      <TouchableOpacity style={styles.primaryBtn} onPress={props.onEditProfile}>
        <Text style={styles.primaryBtnText}>Edit profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={props.onMySkills}>
        <Text style={styles.secondaryBtnText}>My Skills</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={props.onOfferSkill}>
        <Text style={styles.secondaryBtnText}>Offer a skill</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={props.onMyRequests}>
        <Text style={styles.secondaryBtnText}>My Requests</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={props.onMyToolReservations}>
        <Text style={styles.secondaryBtnText}>My Tool Reservations</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={props.onMyFoodReservations}>
        <Text style={styles.secondaryBtnText}>My Food Reservations</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={props.onMyEvents}>
        <Text style={styles.secondaryBtnText}>My Events</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={props.onMyPledges}>
        <Text style={styles.secondaryBtnText}>My Pledges</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dangerBtn} onPress={props.onLogout}>
        <Text style={styles.dangerBtnText}>Log out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
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
})