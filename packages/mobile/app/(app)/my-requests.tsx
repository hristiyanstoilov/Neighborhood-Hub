import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useAuth } from '../../contexts/auth'
import { apiFetch } from '../../lib/api'
import RequestCard, { SkillRequestRow } from '../../components/RequestCard'

type Tab = 'requester' | 'owner'

type FetchState =
  | { type: 'loading' }
  | { type: 'error' }
  | { type: 'ok'; rows: SkillRequestRow[] }

export default function MyRequestsScreen() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('requester')
  const [state, setState] = useState<FetchState>({ type: 'loading' })
  const [refreshing, setRefreshing] = useState(false)

  const fetchRequests = useCallback(async (role: Tab) => {
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
  }, [])

  useEffect(() => {
    setState({ type: 'loading' })
    fetchRequests(tab)
  }, [tab, fetchRequests])

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

  if (!user) return null

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
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#15803d" />
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
