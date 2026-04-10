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
import { useAuth } from '../../../contexts/auth'
import { apiFetch } from '../../../lib/api'
import RequestCard, { SkillRequestRow } from '../../../components/RequestCard'
import { Skeleton } from '../../../components/Skeleton'

type Tab = 'requester' | 'owner'

type FetchState =
  | { type: 'loading' }
  | { type: 'error' }
  | { type: 'ok'; rows: SkillRequestRow[] }

export default function MyRequestsScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('requester')
  const [state, setState] = useState<FetchState>({ type: 'loading' })
  const [refreshing, setRefreshing] = useState(false)

  const fetchRequests = useCallback(async (role: Tab) => {
    if (!user) {
      setState({ type: 'error' })
      return
    }

    try {
      const res = await apiFetch(`/api/skill-requests?role=${role}&limit=50`)
      if (!res.ok) {
        setState({ type: 'error' })
        return
      }
      const json = await res.json()
      setState({ type: 'ok', rows: json.data ?? [] })
    } catch {
      setState({ type: 'error' })
    }
  }, [user])

  useFocusEffect(useCallback(() => {
    if (!user) return
    setState({ type: 'loading' })
    fetchRequests(tab)
  }, [tab, fetchRequests, user]))

  async function handleRefresh() {
    setRefreshing(true)
    await fetchRequests(tab)
    setRefreshing(false)
  }

  function handleStatusChange(id: string, newStatus: string) {
    if (state.type !== 'ok') return
    setState({
      type: 'ok',
      rows: state.rows.map((r) => r.id === id ? { ...r, status: newStatus } : r),
    })
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Please log in to view your requests.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.retryText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
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

      {state.type === 'loading' ? (
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
      ) : state.type === 'error' ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load requests.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchRequests(tab)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={state.rows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              viewerId={user.id}
              onStatusChange={handleStatusChange}
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#15803d" />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#15803d',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#15803d',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    backgroundColor: '#15803d',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
})
