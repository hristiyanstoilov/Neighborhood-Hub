import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export function MySkillsHeader({ onNew }: { onNew: () => void }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>My Skills</Text>
      <TouchableOpacity style={styles.addBtn} onPress={onNew}>
        <Text style={styles.addBtnText}>+ New</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  addBtn: { backgroundColor: '#15803d', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
})