import { useCallback, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import { AppScreen } from '../../../components/AppScreen'
import { mobileTheme } from '../../../lib/theme'
import RequestCard from '../../../components/RequestCard'
import { Skeleton } from '../../../components/Skeleton'
import {
  fetchSkillRequests,
  skillRequestsKeys,
  type RequestRole,
} from '../../../lib/queries/skill-requests'

type Tab = 'requester' | 'owner'

export default function MyRequestsScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('requester')
  const requestsQuery = useQuery({
    queryKey: skillRequestsKeys.list(tab as RequestRole),
    queryFn: () => fetchSkillRequests(tab as RequestRole),
    enabled: Boolean(user),
  })

  useFocusEffect(
    useCallback(() => {
      if (!user) return
      if (requestsQuery.isLoading) return
      void requestsQuery.refetch()
    }, [requestsQuery.isLoading, requestsQuery.refetch, tab, user])
  )

  const rows = requestsQuery.data ?? []
  const isInitialLoading = requestsQuery.isFetching && !requestsQuery.data
  const isRefreshing = requestsQuery.isFetching && !!requestsQuery.data

  async function handleRefresh() {
    await requestsQuery.refetch()
  }

  if (!user) {
    return (
      <AppScreen backgroundColor={mobileTheme.colors.canvas}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Please log in to view your requests.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.retryText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </AppScreen>
    )
  }

  return (
    <AppScreen backgroundColor={mobileTheme.colors.canvas}>
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'requester' && styles.tabActive]}
          onPress={() => setTab('requester')}
        >
          <Text style={[styles.tabText, tab === 'requester' && styles.tabTextActive]}>
            Sent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'owner' && styles.tabActive]}
          onPress={() => setTab('owner')}
        >
          <Text style={[styles.tabText, tab === 'owner' && styles.tabTextActive]}>
            Received
          </Text>
        </TouchableOpacity>
      </View>

      {isInitialLoading ? (
        <View style={styles.loadingWrap}>
          <View style={styles.loadingHeader}>
            <Skeleton width={110} height={22} />
            <View style={styles.loadingTabs}>
              <Skeleton width={86} height={38} radius={8} />
              <Skeleton width={92} height={38} radius={8} />
            </View>
          </View>
          <View style={styles.loadingList}>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} style={styles.loadingCard}>
                <View style={styles.loadingCardHeader}>
                  <View style={{ flex: 1, gap: 8 }}>
                    <Skeleton width="70%" height={16} />
                    <Skeleton width="45%" height={12} />
                  </View>
                  <Skeleton width={72} height={20} radius={999} />
                </View>
                <View style={styles.loadingGrid}>
                  <Skeleton width="100%" height={40} />
                  <Skeleton width="100%" height={40} />
                  <Skeleton width="100%" height={40} />
                  <Skeleton width="100%" height={40} />
                </View>
                <View style={styles.loadingActions}>
                  <Skeleton width={80} height={34} radius={8} />
                  <Skeleton width={80} height={34} radius={8} />
                  <Skeleton width={80} height={34} radius={8} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : requestsQuery.isError && !requestsQuery.data ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load requests.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void requestsQuery.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              viewerId={user.id}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {tab === 'requester'
                  ? "You haven't sent any requests yet."
                  : "You haven't received any requests yet."}
              </Text>
            </View>
          }
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => void handleRefresh()} tintColor={mobileTheme.colors.primary} />
          }
        />
      )}
    </View>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileTheme.colors.canvas,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: mobileTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: mobileTheme.colors.borderSoft,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: mobileTheme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: mobileTheme.colors.textMuted,
  },
  tabTextActive: {
    color: mobileTheme.colors.primary,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingWrap: {
    flex: 1,
    paddingTop: 16,
  },
  loadingHeader: {
    paddingHorizontal: 16,
    gap: 12,
  },
  loadingTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingList: {
    padding: 16,
    gap: 12,
  },
  loadingCard: {
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderSoft,
    padding: 16,
    gap: 12,
  },
  loadingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  loadingGrid: {
    gap: 8,
  },
  loadingActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: mobileTheme.colors.onPrimary,
    fontWeight: '500',
    fontSize: 14,
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 14,
    textAlign: 'center',
  },
})
