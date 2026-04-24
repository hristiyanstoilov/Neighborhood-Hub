import { useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import ToolCard from '../../../components/ToolCard'
import { AppScreen } from '../../../components/AppScreen'
import { PagedListView } from '../../../components/PagedListView'
import { fetchToolsPage, toolsKeys, type ToolsFilters } from '../../../lib/queries/tools'
import { mobileTheme } from '../../../lib/theme'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { label: 'All',       value: null },
  { label: 'Available', value: 'available' },
  { label: 'On loan',   value: 'on_loan' },
]

export default function ToolListScreen() {
  const router = useRouter()
  const [search, setSearch]           = useState('')
  const [debouncedSearch, setDebounced] = useState('')
  const [statusFilter, setStatus]     = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filters: ToolsFilters = {
    search:     debouncedSearch,
    categoryId: null,
    locationId: null,
    status:     statusFilter,
  }

  const query = useInfiniteQuery({
    queryKey:       toolsKeys.list(filters, 1, PAGE_SIZE),
    queryFn:        ({ pageParam = 1 }) => fetchToolsPage({ page: pageParam as number, limit: PAGE_SIZE, ...filters }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
    staleTime: 15_000,
  })

  const tools = query.data?.pages.flatMap((p) => p.tools) ?? []
  const isRefreshing = query.isRefetching && !query.isFetchingNextPage
  const hasMore = query.hasNextPage

  function handleSearchChange(text: string) {
    setSearch(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebounced(text), 350)
  }

  const handleRefresh = useCallback(() => {
    query.refetch()
  }, [query])

  const handleLoadMore = useCallback(() => {
    if (hasMore && !query.isFetchingNextPage) {
      query.fetchNextPage()
    }
  }, [hasMore, query])

  return (
    <AppScreen backgroundColor={mobileTheme.colors.canvasAlt}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Tool Library</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tools…"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Status filter tabs */}
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.label}
            onPress={() => setStatus(opt.value)}
            style={[
              styles.statusTab,
              statusFilter === opt.value && styles.statusTabActive,
            ]}
          >
            <Text style={[
              styles.statusTabText,
              statusFilter === opt.value && styles.statusTabTextActive,
            ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <PagedListView
        data={tools}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ToolCard
            title={item.title}
            ownerName={item.ownerName}
            categoryLabel={item.categoryLabel}
            condition={item.condition}
            status={item.status}
            imageUrl={item.imageUrl}
            onPress={() => router.push(`/tools/${item.id}` as never)}
          />
        )}
        loading={query.isLoading}
        error={query.isError}
        errorMessage="Could not load tools."
        onRetry={() => query.refetch()}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        hasMore={query.hasNextPage}
        loadingMore={query.isFetchingNextPage}
        listContentStyle={styles.listContent}
        emptyMessage="No tools found."
        emptyAction={null}
        footer={null}
      />
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  header:         { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  heading:        { fontSize: 22, fontWeight: '700', color: '#111827' },
  searchRow:      { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' },
  searchBox:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 10 },
  searchIcon:     { marginRight: 6 },
  searchInput:    { flex: 1, height: 36, fontSize: 14, color: '#111827' },
  statusRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  statusTab:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: '#d1d5db' },
  statusTabActive: { backgroundColor: '#15803d', borderColor: '#15803d' },
  statusTabText:  { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  statusTabTextActive: { color: '#fff' },
  listContent:    { paddingTop: 8, paddingBottom: 24 },
  emptyContainer: { flexGrow: 1 },
})
