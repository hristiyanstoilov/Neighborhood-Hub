import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchMySkillsPage, mySkillsKeys } from '../../../lib/queries/my-skills'

const PAGE_SIZE = 20

export function useMySkillsState(enabled: boolean) {
  const query = useInfiniteQuery({
    queryKey: mySkillsKeys.list(PAGE_SIZE),
    initialPageParam: 1,
    enabled,
    queryFn: ({ pageParam }) => fetchMySkillsPage({ page: pageParam, limit: PAGE_SIZE }),
    getNextPageParam: (lastPage, pages) => {
      const loadedCount = pages.reduce((sum, page) => sum + page.skills.length, 0)
      if (loadedCount >= lastPage.total) return undefined
      return pages.length + 1
    },
  })

  const skills = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.skills),
    [query.data?.pages]
  )

  const total = query.data?.pages[query.data.pages.length - 1]?.total ?? skills.length
  const hasMore = skills.length < total
  const isInitialLoading = query.isPending
  const isRefreshing = query.isRefetching && !query.isFetchingNextPage
  const loadingMore = query.isFetchingNextPage
  const isError = query.isError && !query.data

  async function handleRefresh() {
    await query.refetch()
  }

  async function handleLoadMore() {
    if (!hasMore || loadingMore) return
    await query.fetchNextPage()
  }

  return {
    skills,
    hasMore,
    isInitialLoading,
    isRefreshing,
    loadingMore,
    isError,
    handleRefresh,
    handleLoadMore,
    retry: query.refetch,
    isPendingForFocus: query.isLoading,
    refetch: query.refetch,
  }
}