import { useCallback, useMemo } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { AppScreen } from '../../../components/AppScreen'
import { PagedListView } from '../../../components/PagedListView'
import { feedActionText, feedKeys, fetchFeedPage, type FeedItem } from '../../../lib/queries/feed'
import { formatDateTime } from '../../../lib/format'
import { mobileTheme } from '../../../lib/theme'

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
  const isInitial = query.isLoading && !query.data
  const isRefreshing = query.isRefetching && !!query.data

  const handleLoadMore = useCallback(() => {
    if (!query.hasNextPage || query.isFetchingNextPage) return
    void query.fetchNextPage()
  }, [query])

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
    <AppScreen backgroundColor={mobileTheme.colors.canvasAlt}>
      <PagedListView
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text onPress={() => openTarget(item)} style={styles.itemText}>
            {feedActionText(item)}
            {'\n'}
            <Text style={styles.itemDate}>{formatDateTime(item.createdAt)}</Text>
          </Text>
        )}
        loading={isInitial}
        error={query.isError}
        errorMessage="Could not load activity feed."
        onRetry={() => void query.refetch()}
        refreshing={isRefreshing}
        onRefresh={() => void query.refetch()}
        onEndReached={handleLoadMore}
        hasMore={query.hasNextPage}
        loadingMore={query.isFetchingNextPage}
        listContentStyle={styles.listContent}
        emptyMessage="No activity yet."
        footer={
          <TouchableOpacity
            style={styles.loadMoreBtn}
            onPress={handleLoadMore}
            disabled={!query.hasNextPage || query.isFetchingNextPage}
          >
            {query.isFetchingNextPage
              ? <ActivityIndicator color={mobileTheme.colors.primary} />
              : <Text style={styles.loadMoreText}>Load more</Text>
            }
          </TouchableOpacity>
        }
      />
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  listContent: { padding: 16, gap: 10, paddingBottom: 32 },
  itemText: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.borderSoft,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: mobileTheme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  itemDate: { color: mobileTheme.colors.textMuted, fontSize: 12 },
  loadMoreBtn: {
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
})
