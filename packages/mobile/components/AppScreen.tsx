import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'
import { mobileTheme } from '../lib/theme'

type AppScreenProps = {
  children: ReactNode
  backgroundColor?: string
  edges?: Edge[]
  padded?: boolean
}

export function AppScreen({
  children,
  backgroundColor = mobileTheme.colors.canvas,
  edges = ['top', 'bottom'],
  padded = false,
}: AppScreenProps) {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={edges}>
      <View style={[styles.container, padded && styles.padded, { backgroundColor }]}>
        {children}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  padded: {
    padding: 16,
  },
})