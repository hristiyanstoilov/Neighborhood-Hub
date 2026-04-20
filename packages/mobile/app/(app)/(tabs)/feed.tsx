import { useMemo } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { feedActionText, feedKeys, fetchFeedPage, type FeedItem } from '../../../lib/queries/feed'
import { formatDateTime } from '../../../lib/format'

export default function FeedTabScreen() {
  const router = useRouter()

  const query = useInfiniteQuery({
    queryKey: feedKeys.list,
    queryFn: ({ pageParam }) => fetchFeedPage(pageParam, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.flatMap((page) => page.items).length
      return loaded < lastPage.total ? loaded : undefined
    },
  })

  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])

  function openTarget(item: FeedItem) {
    const target = item.targetUrl

    if (target.startsWith('/skills/')) {
      const id = target.split('/').filter(Boolean).at(-1)
      if (id) router.push(`/(app)/skills/${id}`)
      return
    }

    if (target.startsWith('/tools/')) {
      const id = target.split('/').filter(Boolean).at(-1)
      if (id) router.push(`/(app)/tools/${id}`)
      return
    }

    if (target.startsWith('/events/')) {
      const id = target.split('/').filter(Boolean).at(-1)
      if (id) router.push(`/(app)/events/${id}`)
      return
    }

    if (target.startsWith('/drives/')) {
      const id = target.split('/').filter(Boolean).at(-1)
      if (id) router.push(`/(app)/drives/${id}`)
      return
    }

    if (target.startsWith('/food/')) {
      const id = target.split('/').filter(Boolean).at(-1)
      if (id) router.push(`/(app)/food/${id}`)
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor="#15803d" />}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage()
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          query.isLoading ? (
            <Text style={styles.stateText}>Loading activity...</Text>
          ) : (
            <Text style={styles.stateText}>No activity yet.</Text>
          )
        }
        renderItem={({ item }) => (
          <Text onPress={() => openTarget(item)} style={styles.itemText}>
            {feedActionText(item)}
            {'\n'}
            <Text style={styles.itemDate}>{formatDateTime(item.createdAt)}</Text>
          </Text>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  listContent: { padding: 16, gap: 10, paddingBottom: 32 },
  emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateText: { fontSize: 14, color: '#6b7280' },
  itemText: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: '#111827',
    fontSize: 14,
    lineHeight: 20,
  },
  itemDate: { color: '#6b7280', fontSize: 12 },
})
