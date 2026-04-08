import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useAuth } from '../../../contexts/auth'
import { apiFetch } from '../../../lib/api'
import SkillCard from '../../../components/SkillCard'

interface Skill {
  id: string
  title: string
  status: string
  ownerName: string | null
  category: string | null
  imageUrl: string | null
}

interface Category { id: string; slug: string; label: string }
interface Location { id: string; city: string; neighborhood: string }

const PAGE_SIZE = 20

type FetchState =
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'ok'; skills: Skill[]; total: number }

export default function SkillListScreen() {
  const { user } = useAuth()
  const router = useRouter()

  const [state, setState] = useState<FetchState>({ type: 'loading' })
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)

  // Filters
  const [search, setSearch] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null)
  const [filterLocationId, setFilterLocationId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Notifications badge
  const [unreadCount, setUnreadCount] = useState(0)

  // Load categories + locations once on mount
  useEffect(() => {
    Promise.all([apiFetch('/api/categories'), apiFetch('/api/locations')])
      .then(async ([catRes, locRes]) => {
        const [catJson, locJson] = await Promise.all([catRes.json(), locRes.json()])
        setCategories(catJson.data ?? [])
        setLocations((locJson.data ?? []).map((l: any) => ({
          id: l.id,
          city: l.city,
          neighborhood: l.neighborhood,
        })))
      })
      .catch(() => {})
  }, [])

  // Refresh unread notification count when screen is focused
  useFocusEffect(useCallback(() => {
    if (!user) return
    apiFetch('/api/notifications')
      .then((r) => r.json())
      .then((j) => setUnreadCount((j.data ?? []).length))
      .catch(() => {})
  }, [user]))

  const fetchSkills = useCallback(async (
    pageNum: number,
    searchVal: string,
    catId: string | null,
    locId: string | null,
  ) => {
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(pageNum) })
      if (searchVal.trim()) params.set('search', searchVal.trim())
      if (catId) params.set('categoryId', catId)
      if (locId) params.set('locationId', locId)

      const res = await apiFetch(`/api/skills?${params}`)
      if (!res.ok) {
        setState({ type: 'error', message: 'Failed to load skills.' })
        return
      }
      const json = await res.json()
      const rows = (json.data ?? []) as Array<{
        id: string; title: string; status: string
        ownerName: string | null; categoryLabel: string | null
      }>
      const fetched: Skill[] = rows.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        ownerName: r.ownerName,
        category: r.categoryLabel,
        imageUrl: (r as any).imageUrl ?? null,
      }))
      const total: number = json.total ?? fetched.length
      setState((prev) => {
        if (pageNum === 1) return { type: 'ok', skills: fetched, total }
        const existing = prev.type === 'ok' ? prev.skills : []
        return { type: 'ok', skills: [...existing, ...fetched], total }
      })
    } catch {
      setState({ type: 'error', message: 'Network error. Please try again.' })
    }
  }, [])

  useEffect(() => {
    fetchSkills(1, '', null, null)
  }, [fetchSkills])

  // Debounced search — when search text changes reset page + fetch
  function handleSearchChange(text: string) {
    setSearch(text)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => {
      setPage(1)
      setState({ type: 'loading' })
      fetchSkills(1, text, filterCategoryId, filterLocationId)
    }, 300)
  }

  function handleCategoryChange(id: string | null) {
    setFilterCategoryId(id)
    setPage(1)
    setState({ type: 'loading' })
    fetchSkills(1, search, id, filterLocationId)
  }

  function handleLocationChange(id: string | null) {
    setFilterLocationId(id)
    setPage(1)
    setState({ type: 'loading' })
    fetchSkills(1, search, filterCategoryId, id)
  }

  function handleClearFilters() {
    setSearch('')
    setFilterCategoryId(null)
    setFilterLocationId(null)
    setPage(1)
    setState({ type: 'loading' })
    fetchSkills(1, '', null, null)
  }

  async function handleRefresh() {
    setRefreshing(true)
    setPage(1)
    await fetchSkills(1, search, filterCategoryId, filterLocationId)
    setRefreshing(false)
  }

  async function handleLoadMore() {
    if (loadingMore) return
    const nextPage = page + 1
    setLoadingMore(true)
    setPage(nextPage)
    await fetchSkills(nextPage, search, filterCategoryId, filterLocationId)
    setLoadingMore(false)
  }

  const activeFilterCount = (filterCategoryId ? 1 : 0) + (filterLocationId ? 1 : 0)
  const hasActiveFilters = !!search.trim() || !!filterCategoryId || !!filterLocationId

  function renderHeader() {
    return (
      <View>
        {/* Top bar */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Skills</Text>
          <View style={styles.headerActions}>
            {user ? (
              <>
                {/* Notifications bell — shows unread badge */}
                <TouchableOpacity
                  onPress={() => router.push('/(app)/(tabs)/notifications')}
                  style={styles.bellWrapper}
                >
                  <Text style={styles.bellIcon}>🔔</Text>
                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(app)/chat')}>
                  <Text style={styles.headerLink}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(app)/radar')}>
                  <Text style={styles.headerLink}>Radar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.headerLink}>Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={handleSearchChange}
              placeholder="Search skills…"
              maxLength={100}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
          <TouchableOpacity
            style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
            onPress={() => setShowFilters((v) => !v)}
          >
            <Text style={[styles.filterToggleText, showFilters && styles.filterToggleTextActive]}>
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter panel */}
        {showFilters && (
          <View style={styles.filterPanel}>
            {/* Categories */}
            {categories.length > 0 && (
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.chip, !filterCategoryId && styles.chipActive]}
                    onPress={() => handleCategoryChange(null)}
                  >
                    <Text style={[styles.chipText, !filterCategoryId && styles.chipTextActive]}>All</Text>
                  </TouchableOpacity>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chip, filterCategoryId === c.id && styles.chipActive]}
                      onPress={() => handleCategoryChange(c.id)}
                    >
                      <Text style={[styles.chipText, filterCategoryId === c.id && styles.chipTextActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Locations */}
            {locations.length > 0 && (
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>Location</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.chip, !filterLocationId && styles.chipActive]}
                    onPress={() => handleLocationChange(null)}
                  >
                    <Text style={[styles.chipText, !filterLocationId && styles.chipTextActive]}>All</Text>
                  </TouchableOpacity>
                  {locations.map((l) => (
                    <TouchableOpacity
                      key={l.id}
                      style={[styles.chip, filterLocationId === l.id && styles.chipActive]}
                      onPress={() => handleLocationChange(l.id)}
                    >
                      <Text style={[styles.chipText, filterLocationId === l.id && styles.chipTextActive]}>{l.neighborhood}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Clear */}
            {hasActiveFilters && (
              <TouchableOpacity onPress={handleClearFilters} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Clear all filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchSkills(1, search, filterCategoryId, filterLocationId)}>
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
            imageUrl={item.imageUrl}
            onPress={() => router.push(`/(app)/skills/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {hasActiveFilters ? 'No skills found for this search.' : 'No skills found.'}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={handleClearFilters}>
                <Text style={styles.clearLinkText}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore} disabled={loadingMore}>
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, backgroundColor: '#f3f4f6' },
  list: { paddingBottom: 24 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    flexWrap: 'wrap',
    gap: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  headerLink: { fontSize: 13, color: '#15803d', fontWeight: '500' },
  logoutText: { fontSize: 13, color: '#6b7280' },

  // Bell
  bellWrapper: { position: 'relative', padding: 2 },
  bellIcon: { fontSize: 16 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700', lineHeight: 11 },

  // Search
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 6,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 9,
  },
  filterToggle: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  filterToggleActive: { backgroundColor: '#15803d', borderColor: '#15803d' },
  filterToggleText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  filterToggleTextActive: { color: '#fff' },

  // Filter panel
  filterPanel: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
    gap: 12,
  },
  filterGroup: { gap: 8 },
  filterGroupLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    marginRight: 6,
  },
  chipActive: { backgroundColor: '#15803d', borderColor: '#15803d' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  clearBtn: { alignSelf: 'flex-start' },
  clearBtnText: { fontSize: 13, color: '#15803d', fontWeight: '500' },

  // List states
  empty: { paddingTop: 60, alignItems: 'center', gap: 8 },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  clearLinkText: { color: '#15803d', fontSize: 13, fontWeight: '500' },
  errorText: { color: '#dc2626', textAlign: 'center', marginTop: 40, fontSize: 14 },
  retryButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#15803d',
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '500' },
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
  loadMoreText: { color: '#15803d', fontWeight: '500', fontSize: 14 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#15803d',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '400' },
})