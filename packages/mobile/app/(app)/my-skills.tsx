import { useCallback, useState } from 'react'
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
import { apiFetch } from '../../lib/api'
import SkillCard from '../../components/SkillCard'
import { useAuth } from '../../contexts/auth'

interface MySkill {
  id: string
  title: string
  status: string
  imageUrl: string | null
  categoryLabel: string | null
  locationNeighborhood: string | null
}

const PAGE_SIZE = 20

type FetchState =
  | { type: 'loading' }
  | { type: 'error' }
  | { type: 'ok'; skills: MySkill[]; total: number }

export default function MySkillsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [state, setState] = useState<FetchState>({ type: 'loading' })
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)

  const fetchMySkills = useCallback(async (pageNum = 1) => {
    try {
      const res = await apiFetch(`/api/profile/skills?limit=${PAGE_SIZE}&page=${pageNum}`)
      if (!res.ok) {
        setState({ type: 'error' })
        return
      }
      const json = await res.json()
      const rows: MySkill[] = (json.data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        imageUrl: r.imageUrl ?? null,
        categoryLabel: r.categoryLabel ?? null,
        locationNeighborhood: r.locationNeighborhood ?? null,
      }))
      const total: number = json.total ?? rows.length
      setState((prev) => {
        if (pageNum === 1) return { type: 'ok', skills: rows, total }
        const existing = prev.type === 'ok' ? prev.skills : []
        return { type: 'ok', skills: [...existing, ...rows], total }
      })
    } catch {
      setState({ type: 'error' })
    }
  }, [])

  useFocusEffect(useCallback(() => {
    if (!user) {
      setState({ type: 'error' })
      return
    }
    setState({ type: 'loading' })
    setPage(1)
    fetchMySkills(1)
  }, [fetchMySkills, user]))

  async function handleRefresh() {
    setRefreshing(true)
    setPage(1)
    await fetchMySkills(1)
    setRefreshing(false)
  }

  async function handleLoadMore() {
    if (loadingMore) return
    const nextPage = page + 1
    setLoadingMore(true)
    setPage(nextPage)
    await fetchMySkills(nextPage)
    setLoadingMore(false)
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Please log in to manage your skills.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.btnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (state.type === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    )
  }

  if (state.type === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load your skills.</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
            setState({ type: 'loading' })
            void fetchMySkills(1)
          }}
        >
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const hasMore = state.skills.length < state.total

  return (
    <View style={styles.container}>
      <FlatList
        data={state.skills}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Skills</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(app)/skills/new')}>
              <Text style={styles.addBtnText}>+ New</Text>
            </TouchableOpacity>
          </View>
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
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No skills yet</Text>
            <Text style={styles.emptySubtitle}>Share what you know with your neighborhood.</Text>
            <TouchableOpacity style={styles.btn} onPress={() => router.push('/(app)/skills/new')}>
              <Text style={styles.btnText}>Offer a skill</Text>
            </TouchableOpacity>
          </View>
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#15803d" />
        }
        contentContainerStyle={state.skills.length === 0 ? styles.emptyContainer : styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
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
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubtitle: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
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
  btn: { backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  errorText: { color: '#dc2626', fontSize: 14, marginBottom: 12 },
})