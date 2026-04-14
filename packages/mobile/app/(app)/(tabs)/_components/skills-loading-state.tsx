import { View, StyleSheet } from 'react-native'
import { Skeleton } from '../../../../components/Skeleton'

export function SkillsLoadingState({ header }: { header: React.ReactNode }) {
  return (
    <View style={styles.container}>
      {header}
      <View style={styles.loadingList}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.loadingCard}>
            <Skeleton height={120} radius={0} />
            <View style={styles.loadingCardBody}>
              <View style={styles.loadingTopRow}>
                <Skeleton width="62%" height={16} />
                <Skeleton width={64} height={20} radius={999} />
              </View>
              <Skeleton width="85%" height={14} />
              <View style={styles.loadingMetaRow}>
                <Skeleton width={88} height={18} radius={999} />
                <Skeleton width={72} height={18} radius={999} />
                <Skeleton width={60} height={18} radius={999} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loadingList: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  loadingCardBody: { padding: 14, gap: 10 },
  loadingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  loadingMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
})