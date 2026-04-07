import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../contexts/auth'
import { apiFetch } from '../../lib/api'
import SkillCard from '../../components/SkillCard'

interface Skill {
  id: string
  title: string
  status: string
  ownerName: string | null
  category: string | null
}

const PAGE_SIZE = 20

type FetchState =
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'ok'; skills: Skill[]; total: number }

export default function SkillListScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [state, setState] = useState<FetchState>({ type: 'loading' })
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)

  const fetchSkills = useCallback(async (pageNum = 1) => {
    try {
      const res = await apiFetch(`/api/skills?limit=${PAGE_SIZE}&page=${pageNum}`)
      if (!res.ok) {
        setState({ type: 'error', message: 'Failed to load skills.' })
        return
      }
      const json = await res.json()
      const rows = (json.data ?? []) as Array<{
        id: string
        title: string
        status: string
        ownerName: string | null
        categoryLabel: string | null
      }>
      const fetched: Skill[] = rows.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        ownerName: r.ownerName,
        category: r.categoryLabel,
      }))
      const total: number = json.total ?? fetched.length
      setState((prev) => {
        if (pageNum === 1) {
          return { type: 'ok', skills: fetched, total }
        }
        const existing = prev.type === 'ok' ? prev.skills : []
        return { type: 'ok', skills: [...existing, ...fetched], total }
      })
    } catch {
      setState({ type: 'error', message: 'Network error. Please try again.' })
    }
  }, [])

  useEffect(() => {
    fetchSkills(1)
  }, [fetchSkills])

  async function handleRefresh() {
    setRefreshing(true)
    setPage(1)
    await fetchSkills(1)
    setRefreshing(false)
  }

  async function handleLoadMore() {
    if (loadingMore) return
    const nextPage = page + 1
    setLoadingMore(true)
    setPage(nextPage)
    await fetchSkills(nextPage)
    setLoadingMore(false)
  }

  function renderHeader() {
    return (
      <View>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Skills</Text>
          <View style={styles.headerActions}>
            {user ? (
              <>
                <TouchableOpacity onPress={() => router.push('/(app)/radar')}>
                  <Text style={styles.myRequestsText}>Radar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(app)/my-requests')}>
                  <Text style={styles.myRequestsText}>My Requests</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(app)/profile')}>
                  <Text style={styles.myRequestsText}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={logout}>
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    )
  }

  if (state.type === 'loading') {
    return (
      <View style={styles.center}>
        {renderHeader()}
        <ActivityIndicator size="large" color="#15803d" style={{ marginTop: 40 }} />
      </View>
    )
  }

  if (state.type === 'error') {
    return (
      <View style={styles.center}>
        {renderHeader()}
        <Text style={styles.errorText}>{state.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchSkills(1)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const hasMore = state.type === 'ok' && state.skills.length < state.total

  return (
    <View style={styles.container}>
      <FlatList
        data={state.skills}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <SkillCard
            title={item.title}
            ownerName={item.ownerName}
            category={item.category}
            status={item.status}
            onPress={() => router.push(`/(app)/skills/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No skills found.</Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity style={styles.loadMoreButton} onPress={() => handleLoadMore()} disabled={loadingMore}>
              {loadingMore
                ? <ActivityIndicator color="#15803d" />
                : <Text style={styles.loadMoreText}>Load more</Text>
              }
            </TouchableOpacity>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#15803d" />
        }
        contentContainerStyle={styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  center: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  list: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  myRequestsText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '500',
  },
  logoutText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loginText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '500',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  retryButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#15803d',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '500',
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  loadMoreButton: {
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
  loadMoreText: {
    color: '#15803d',
    fontWeight: '500',
    fontSize: 14,
  },
})
