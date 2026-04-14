import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Skeleton, SkeletonCircle } from '../../../../components/Skeleton'

export function ProfileLoadingState() {
  return (
    <View style={styles.loadingWrap}>
      <View style={styles.loadingCard}>
        <View style={styles.loadingHeader}>
          <SkeletonCircle size={72} />
          <View style={styles.loadingHeaderText}>
            <Skeleton width="55%" height={18} />
            <Skeleton width="70%" height={14} />
            <Skeleton width="45%" height={14} />
          </View>
        </View>
        <Skeleton width="100%" height={42} radius={12} />
        <Skeleton width="100%" height={42} radius={12} />
        <Skeleton width="100%" height={42} radius={12} />
        <Skeleton width="100%" height={42} radius={12} />
      </View>
    </View>
  )
}

export function ProfileErrorState(props: { onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Could not load profile.</Text>
      <TouchableOpacity style={styles.btn} onPress={props.onRetry}>
        <Text style={styles.btnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  )
}

export function ProfileUnauthorizedState(props: { onLogin: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Please log in to view your profile.</Text>
      <TouchableOpacity style={styles.btn} onPress={props.onLogin}>
        <Text style={styles.btnText}>Go to Login</Text>
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
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f3f4f6',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  loadingHeaderText: {
    flex: 1,
    gap: 8,
  },
  btn: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 12,
  },
})