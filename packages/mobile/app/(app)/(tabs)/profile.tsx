import { useCallback } from 'react'
import {
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../../contexts/auth'
import { apiFetch } from '../../../lib/api'
import { patchOwnProfile, fetchOwnProfile, profileKeys, profileUpdateErrorMessage } from '../../../lib/queries/profile'
import {
  ProfileActions,
  ProfileBioSection,
  ProfileHeader,
  ProfileVerificationBadge,
  ProfileVisibilitySection,
} from './_components/profile-sections'
import {
  ProfileErrorState,
  ProfileLoadingState,
  ProfileUnauthorizedState,
} from './_components/profile-states'

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: profileKeys.me(),
    queryFn: fetchOwnProfile,
    enabled: Boolean(user),
  })

  const avatarMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      await patchOwnProfile({ avatarUrl })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.me() })
    },
  })

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
      await avatarMutation.mutateAsync(uploadJson.data.url)
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      Alert.alert('Error', profileUpdateErrorMessage(code))
    }
  }

  useFocusEffect(useCallback(() => {
    if (user) {
      void profileQuery.refetch()
    }
  }, [profileQuery, user]))

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
    return <ProfileUnauthorizedState onLogin={() => router.replace('/(auth)/login')} />
  }

  if (profileQuery.isLoading) {
    return <ProfileLoadingState />
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <ProfileErrorState onRetry={() => { void profileQuery.refetch() }} />
  }

  const profile = profileQuery.data

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={profileQuery.isRefetching}
          onRefresh={() => { void profileQuery.refetch() }}
          tintColor="#15803d"
        />
      }
    >
      <ProfileHeader
        profile={profile}
        uploadingAvatar={avatarMutation.isPending}
        onPickAvatar={handlePickAvatar}
      />
      <ProfileVerificationBadge verified={Boolean(profile.emailVerifiedAt)} />
      <ProfileBioSection bio={profile.bio} />
      <ProfileVisibilitySection isPublic={profile.isPublic} />
      <ProfileActions
        onEditProfile={() => router.push('/(app)/profile/edit')}
        onMySkills={() => router.push('/(app)/my-skills')}
        onOfferSkill={() => router.push('/(app)/skills/new')}
        onMyRequests={() => router.push('/(app)/(tabs)/my-requests')}
        onLogout={handleLogout}
      />
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
})