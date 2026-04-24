import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { apiFetch } from './api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null)
  return tokenData?.data ?? null
}

export async function savePushToken(token: string) {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android'
  await apiFetch('/api/push-tokens', {
    method: 'POST',
    body: JSON.stringify({ token, platform }),
  })
}

export async function removePushToken(token: string) {
  await apiFetch('/api/push-tokens', {
    method: 'DELETE',
    body: JSON.stringify({ token }),
  })
}

export function usePushNotifications(userId: string | undefined) {
  const tokenRef = useRef<string | null>(null)

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    async function setup() {
      const token = await registerForPushNotifications()
      if (!token || cancelled) return
      tokenRef.current = token
      await savePushToken(token).catch(() => {})
    }

    void setup()

    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      // Tapping a notification — could navigate here in the future
    })

    return () => {
      cancelled = true
      subscription.remove()
    }
  }, [userId])
}
