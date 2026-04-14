import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export function SkillsErrorState({
  message,
  onRetry,
  header,
}: {
  message: string
  onRetry: () => void
  header: React.ReactNode
}) {
  return (
    <View style={styles.center}>
      {header}
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  )
}

export function SkillsEmptyState({
  hasActiveFilters,
  onClearFilters,
}: {
  hasActiveFilters: boolean
  onClearFilters: () => void
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>
        {hasActiveFilters ? 'No skills found for this search.' : 'No skills found.'}
      </Text>
      {hasActiveFilters && (
        <TouchableOpacity onPress={onClearFilters}>
          <Text style={styles.clearLinkText}>Clear filters</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#f3f4f6' },
  errorText: { color: '#dc2626', textAlign: 'center', marginTop: 40, fontSize: 14 },
  retryButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#15803d',
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '500' },
  empty: { paddingTop: 60, alignItems: 'center', gap: 8 },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  clearLinkText: { color: '#15803d', fontSize: 13, fontWeight: '500' },
})