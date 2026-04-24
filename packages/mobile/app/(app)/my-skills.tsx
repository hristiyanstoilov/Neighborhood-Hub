import { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { AppScreen } from '../../components/AppScreen'
import { PagedListView } from '../../components/PagedListView'
import SkillCard from '../../components/SkillCard'
import { useAuth } from '../../contexts/auth'
import { mobileTheme } from '../../lib/theme'
import { useMySkillsState } from './_hooks/use-my-skills-state'
import { MySkillsHeader } from './_components/my-skills-header'
import {
  MySkillsEmptyState,
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

  return (
    <AppScreen backgroundColor={mobileTheme.colors.canvasAlt}>
      <PagedListView
        data={skills}
        keyExtractor={(item) => item.id}
        listHeader={<MySkillsHeader onNew={() => router.push('/(app)/skills/new')} />}
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
        loading={false}
        error={isError}
        errorMessage="Could not load your skills."
        onRetry={() => void retry()}
        refreshing={isRefreshing}
        onRefresh={() => void handleRefresh()}
        onEndReached={hasMore ? handleLoadMore : undefined}
        hasMore={hasMore}
        loadingMore={loadingMore}
        listContentStyle={styles.list}
        emptyMessage=""
        emptyComponent={<MySkillsEmptyState onOffer={() => router.push('/(app)/skills/new')} />}
        footer={
          <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} disabled={loadingMore}>
            {loadingMore
              ? <ActivityIndicator color={mobileTheme.colors.primary} />
              : <Text style={styles.loadMoreText}>Load more</Text>
            }
          </TouchableOpacity>
        }
      />
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24 },
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
    backgroundColor: mobileTheme.colors.primarySoft,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: mobileTheme.colors.primarySoftBorder,
  },
  loadMoreText: { color: mobileTheme.colors.primary, fontWeight: '500', fontSize: 14 },
})