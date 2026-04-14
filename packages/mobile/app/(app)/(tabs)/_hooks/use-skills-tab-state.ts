import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  fetchCategories,
  fetchLocations,
  fetchSkillsPage,
  skillsKeys,
  type SkillsFilters,
} from '../../../../lib/queries/skills'

const PAGE_SIZE = 20

export function useSkillsTabState() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null)
  const [filterLocationId, setFilterLocationId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (searchDebounce.current) {
        clearTimeout(searchDebounce.current)
      }
    }
  }, [])

  const filters: SkillsFilters = {
    search: debouncedSearch,
    categoryId: filterCategoryId,
    locationId: filterLocationId,
  }

  const categoriesQuery = useQuery({
    queryKey: skillsKeys.categories(),
    queryFn: fetchCategories,
  })

  const locationsQuery = useQuery({
    queryKey: skillsKeys.locations(),
    queryFn: fetchLocations,
  })

  const skillsQuery = useInfiniteQuery({
    queryKey: skillsKeys.list(filters, PAGE_SIZE),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchSkillsPage({
        page: pageParam,
        limit: PAGE_SIZE,
        search: filters.search,
        categoryId: filters.categoryId,
        locationId: filters.locationId,
      }),
    getNextPageParam: (lastPage, pages) => {
      const loadedCount = pages.reduce((sum, page) => sum + page.skills.length, 0)
      if (loadedCount >= lastPage.total) return undefined
      return pages.length + 1
    },
  })

  const skills = useMemo(
    () => (skillsQuery.data?.pages ?? []).flatMap((page) => page.skills),
    [skillsQuery.data?.pages]
  )

  const total = skillsQuery.data?.pages[skillsQuery.data.pages.length - 1]?.total ?? skills.length
  const hasMore = skills.length < total
  const isInitialLoading = skillsQuery.isPending
  const isError = skillsQuery.isError && !(skillsQuery.data?.pages.length)
  const errorMessage = skillsQuery.error instanceof Error
    ? 'Failed to load skills.'
    : 'Network error. Please try again.'

  const isRefreshing = skillsQuery.isRefetching && !skillsQuery.isFetchingNextPage
  const loadingMore = skillsQuery.isFetchingNextPage

  function handleSearchChange(text: string) {
    setSearch(text)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => {
      setDebouncedSearch(text)
    }, 300)
  }

  function handleCategoryChange(id: string | null) {
    setFilterCategoryId(id)
  }

  function handleLocationChange(id: string | null) {
    setFilterLocationId(id)
  }

  function handleClearFilters() {
    setSearch('')
    setDebouncedSearch('')
    setFilterCategoryId(null)
    setFilterLocationId(null)
  }

  async function handleRefresh() {
    await skillsQuery.refetch()
  }

  async function handleLoadMore() {
    if (!hasMore || loadingMore) return
    await skillsQuery.fetchNextPage()
  }

  const activeFilterCount = (filterCategoryId ? 1 : 0) + (filterLocationId ? 1 : 0)
  const hasActiveFilters = !!search.trim() || !!filterCategoryId || !!filterLocationId

  return {
    search,
    showFilters,
    setShowFilters,
    filterCategoryId,
    filterLocationId,
    categories: categoriesQuery.data ?? [],
    locations: locationsQuery.data ?? [],
    skills,
    hasMore,
    loadingMore,
    isRefreshing,
    isInitialLoading,
    isError,
    errorMessage,
    activeFilterCount,
    hasActiveFilters,
    handleSearchChange,
    handleCategoryChange,
    handleLocationChange,
    handleClearFilters,
    handleRefresh,
    handleLoadMore,
    retry: skillsQuery.refetch,
  }
}