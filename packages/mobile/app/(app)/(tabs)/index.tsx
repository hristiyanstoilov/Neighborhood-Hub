import { useCallback, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import SkillCard from '../../../components/SkillCard'
import { AppScreen } from '../../../components/AppScreen'
import { mobileTheme } from '../../../lib/theme'
import { fetchNotifications, notificationsKeys } from '../../../lib/queries/notifications'
import { SkillsHeader } from './_components/skills-header'
import { SkillsLoadingState } from './_components/skills-loading-state'
import { SkillsEmptyState, SkillsErrorState } from './_components/skills-list-states'
import { useSkillsTabState } from './_hooks/use-skills-tab-state'

export default function SkillListScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const { locationId: paramLocationId } = useLocalSearchParams<{ locationId?: string }>()

  const {
    search,
    showFilters,
    setShowFilters,
    filterCategoryId,
    filterLocationId,
    categories,
    locations,
    skills,
    hasMore,
    loadingMore,
    isRefreshing,
    isInitialLoading,
    isError,
    errorMessage,
    activeFilterCount,
    hasActiveFilters,
    handleSearchChange,
    handleCategoryChange,
    handleLocationChange,
    handleClearFilters,
    handleRefresh,
    handleLoadMore,
    retry,
  } = useSkillsTabState()

  // Apply location filter when navigating here from the Radar map
  useEffect(() => {
    if (paramLocationId) {
      handleLocationChange(paramLocationId)
    }
  }, [paramLocationId]) // eslint-disable-line react-hooks/exhaustive-deps

  const notificationsQuery = useQuery({
    queryKey: notificationsKeys.list(),
    queryFn: fetchNotifications,
    enabled: Boolean(user),
    refetchInterval: 30_000,
  })

  const unreadCount = notificationsQuery.data?.length ?? 0

  // Also refresh on focus for snappier feel when switching tabs
  useFocusEffect(
    useCallback(() => {
      if (!user) return
      if (notificationsQuery.isLoading) return
      void notificationsQuery.refetch()
    }, [notificationsQuery.isLoading, notificationsQuery.refetch, user])
  )


  const communityRow = (
    <View style={styles.communityRow}>
      <TouchableOpacity style={styles.communityBtn} onPress={() => router.push('/(app)/events')}>
        <Text style={styles.communityBtnIcon}>📅</Text>
        <Text style={styles.communityBtnLabel}>Events</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.communityBtn} onPress={() => router.push('/(app)/drives')}>
        <Text style={styles.communityBtnIcon}>🫶</Text>
        <Text style={styles.communityBtnLabel}>Drives</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.communityBtn} onPress={() => router.push('/(app)/food')}>
        <Text style={styles.communityBtnIcon}>🍲</Text>
        <Text style={styles.communityBtnLabel}>Food</Text>
      </TouchableOpacity>
    </View>
  )

  const header = (
    <View>
      <SkillsHeader
        userExists={Boolean(user)}
        unreadCount={unreadCount}
      showFilters={showFilters}
      activeFilterCount={activeFilterCount}
      search={search}
      categories={categories}
      locations={locations}
      filterCategoryId={filterCategoryId}
      filterLocationId={filterLocationId}
      hasActiveFilters={hasActiveFilters}
      onSearchChange={handleSearchChange}
      onToggleFilters={() => setShowFilters((value) => !value)}
      onCategoryChange={handleCategoryChange}
      onLocationChange={handleLocationChange}
      onClearFilters={handleClearFilters}
      onOpenNotifications={() => router.push('/(app)/(tabs)/notifications')}
      onOpenChat={() => router.push('/(app)/chat')}
      onOpenRadar={() => router.push('/(app)/radar')}
      onOpenLogin={() => router.push('/(auth)/login')}
    />
      {communityRow}
    </View>
  )

  if (isInitialLoading) {
    return (
      <AppScreen>
        <SkillsLoadingState header={header} />
      </AppScreen>
    )
  }

  if (isError) {
    return (
      <AppScreen>
        <SkillsErrorState
          message={errorMessage}
          header={header}
          onRetry={() => {
            void retry()
          }}
        />
      </AppScreen>
    )
  }

  return (
    <AppScreen>
      <FlatList
        data={skills}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <SkillCard
            title={item.title}
            ownerName={item.ownerName}
            category={item.category}
            status={item.status}
            imageUrl={item.imageUrl}
            onPress={() => router.push(`/(app)/skills/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <SkillsEmptyState hasActiveFilters={hasActiveFilters} onClearFilters={handleClearFilters} />
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore} disabled={loadingMore}>
              {loadingMore
                ? <ActivityIndicator color={mobileTheme.colors.primary} />
                : <Text style={styles.loadMoreText}>Load more</Text>
              }
            </TouchableOpacity>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => void handleRefresh()} tintColor={mobileTheme.colors.primary} />
        }
        contentContainerStyle={styles.list}
      />

      {/* FAB */}
      {user && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(app)/skills/new')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: mobileTheme.colors.canvas },
  list: { paddingBottom: 24 },
  communityRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  communityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    paddingVertical: 10,
  },
  communityBtnIcon:  { fontSize: 16 },
  communityBtnLabel: { fontSize: 13, fontWeight: '600', color: mobileTheme.colors.textSecondary },
  loadMoreButton: {
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

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: mobileTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: mobileTheme.colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  fabText: { color: mobileTheme.colors.onPrimary, fontSize: 28, lineHeight: 32, fontWeight: '400' },
})