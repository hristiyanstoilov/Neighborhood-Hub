import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'

export function MySkillsLoadingState() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#15803d" />
    </View>
  )
}

export function MySkillsLoginRequiredState({ onLogin }: { onLogin: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Please log in to manage your skills.</Text>
      <TouchableOpacity style={styles.btn} onPress={onLogin}>
        <Text style={styles.btnText}>Go to Login</Text>
      </TouchableOpacity>
    </View>
  )
}

export function MySkillsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Could not load your skills.</Text>
      <TouchableOpacity style={styles.btn} onPress={onRetry}>
        <Text style={styles.btnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  )
}

export function MySkillsEmptyState({ onOffer }: { onOffer: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No skills yet</Text>
      <Text style={styles.emptySubtitle}>Share what you know with your neighborhood.</Text>
      <TouchableOpacity style={styles.btn} onPress={onOffer}>
        <Text style={styles.btnText}>Offer a skill</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubtitle: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  btn: { backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  errorText: { color: '#dc2626', fontSize: 14, marginBottom: 12 },
})