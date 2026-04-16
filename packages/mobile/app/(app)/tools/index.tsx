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
import { fetchToolsPage, toolsKeys, type ToolsFilters } from '../../../lib/queries/tools'

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
    <View style={styles.container}>
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
      {query.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#15803d" size="large" />
        </View>
      ) : query.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load tools.</Text>
          <TouchableOpacity onPress={() => query.refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
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
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No tools found.</Text>
            </View>
          }
          ListFooterComponent={
            query.isFetchingNextPage
              ? <ActivityIndicator color="#15803d" style={styles.footerLoader} />
              : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#15803d"
            />
          }
          contentContainerStyle={tools.length === 0 ? styles.emptyContainer : styles.listContent}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f9fafb' },
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
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyContainer: { flexGrow: 1 },
  listContent:    { paddingTop: 8, paddingBottom: 24 },
  emptyText:      { fontSize: 15, color: '#9ca3af' },
  errorText:      { fontSize: 15, color: '#6b7280', marginBottom: 12 },
  retryBtn:       { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#15803d', borderRadius: 8 },
  retryText:      { color: '#fff', fontWeight: '600', fontSize: 14 },
  footerLoader:   { paddingVertical: 16 },
})
