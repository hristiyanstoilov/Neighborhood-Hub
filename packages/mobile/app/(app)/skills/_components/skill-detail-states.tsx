import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'

export function SkillDetailLoadingState() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#15803d" />
    </View>
  )
}

export function SkillDetailNotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.notFoundTitle}>Skill not found</Text>
      <Text style={styles.notFoundSub}>This skill may have been removed.</Text>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Go back</Text>
      </TouchableOpacity>
    </View>
  )
}

export function SkillDetailErrorState({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Failed to load skill.</Text>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Go back</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f3f4f6',
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