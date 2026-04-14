import { useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import SkillCard from '../../components/SkillCard'
import { useAuth } from '../../contexts/auth'
import { useMySkillsState } from './_hooks/use-my-skills-state'
import { MySkillsHeader } from './_components/my-skills-header'
import {
  MySkillsEmptyState,
  MySkillsErrorState,
  MySkillsLoadingState,
  MySkillsLoginRequiredState,
} from './_components/my-skills-states'

export default function MySkillsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const {
    skills,
    hasMore,
    isInitialLoading,
    isRefreshing,
    loadingMore,
    isError,
    handleRefresh,
    handleLoadMore,
    retry,
    isPendingForFocus,
    refetch,
  } = useMySkillsState(Boolean(user))

  useFocusEffect(
    useCallback(() => {
      if (!user) return
      if (isPendingForFocus) return
      void refetch()
    }, [isPendingForFocus, refetch, user])
  )

  if (!user) {
    return <MySkillsLoginRequiredState onLogin={() => router.replace('/(auth)/login')} />
  }

  if (isInitialLoading) {
    return <MySkillsLoadingState />
  }

  if (isError) {
    return <MySkillsErrorState onRetry={() => void retry()} />
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={skills}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <MySkillsHeader onNew={() => router.push('/(app)/skills/new')} />
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <SkillCard
              title={item.title}
              status={item.status}
              category={item.categoryLabel}
              imageUrl={item.imageUrl}
              ownerName={null}
              onPress={() => router.push(`/(app)/skills/${item.id}`)}
            />
            <TouchableOpacity
              style={styles.editChip}
              onPress={() => router.push(`/(app)/skills/edit/${item.id}`)}
            >
              <Text style={styles.editChipText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <MySkillsEmptyState onOffer={() => router.push('/(app)/skills/new')} />
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} disabled={loadingMore}>
              {loadingMore
                ? <ActivityIndicator color="#15803d" />
                : <Text style={styles.loadMoreText}>Load more</Text>
              }
            </TouchableOpacity>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => void handleRefresh()} tintColor="#15803d" />
        }
        contentContainerStyle={skills.length === 0 ? styles.emptyContainer : styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  list: { paddingBottom: 24 },
  emptyContainer: { flex: 1 },
  cardWrapper: { position: 'relative' },
  editChip: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  editChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  loadMoreBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  loadMoreText: { color: '#15803d', fontWeight: '500', fontSize: 14 },
})