import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '../contexts/auth'
import { QueryProvider } from '../components/query-provider'
import { ToastProvider } from '../lib/toast'
import { usePushNotifications } from '../lib/push-notifications'

function RootNavigation() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  usePushNotifications(user?.id)

  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      router.replace('/(app)')
    }
  }, [user, loading, segments, router])

  return <Slot />
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider>
          <ToastProvider>
            <StatusBar style="auto" />
            <RootNavigation />
          </ToastProvider>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  )
}
