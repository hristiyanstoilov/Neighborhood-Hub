'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import {
  SearchResultCard,
  type DriveSearchResult,
  type EventSearchResult,
  type FoodSearchResult,
  type SkillSearchResult,
  type ToolSearchResult,
} from './search-result-card'
import { SearchResultsGrid } from './search-results-grid'
import { LocationFilter } from './location-filter'

type SearchTab = 'all' | 'skills' | 'tools' | 'events' | 'drives' | 'food'

type SearchResponse = {
  query: string
  skills: SkillSearchResult[]
  tools: ToolSearchResult[]
  events: EventSearchResult[]
  drives: DriveSearchResult[]
  food: FoodSearchResult[]
  totalByType: {
    skills: number
    tools: number
    events: number
    drives: number
    food: number
  }
}

type SearchResultsViewProps = {
  initialQuery: string
  initialType?: string
  initialLocationId?: string
}

const tabs: SearchTab[] = ['all', 'skills', 'tools', 'events', 'drives', 'food']

function renderSkills(items: SkillSearchResult[]) {
  return items.map((item) => <SearchResultCard key={item.id} type="skills" item={item} />)
}

function renderTools(items: ToolSearchResult[]) {
  return items.map((item) => <SearchResultCard key={item.id} type="tools" item={item} />)
}

function renderEvents(items: EventSearchResult[]) {
  return items.map((item) => <SearchResultCard key={item.id} type="events" item={item} />)
}

function renderDrives(items: DriveSearchResult[]) {
  return items.map((item) => <SearchResultCard key={item.id} type="drives" item={item} />)
}

function renderFood(items: FoodSearchResult[]) {
  return items.map((item) => <SearchResultCard key={item.id} type="food" item={item} />)
}

export function SearchResultsView({ initialQuery, initialType, initialLocationId }: SearchResultsViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [activeType, setActiveType] = useState<SearchTab>(tabs.includes((initialType ?? 'all') as SearchTab) ? (initialType as SearchTab) : 'all')
  const [locationId, setLocationId] = useState<string | undefined>(initialLocationId)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let cancelled = false

    async function loadResults() {
      if (debouncedQuery.length < 2) {
        setResults(null)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ q: debouncedQuery, limit: '8' })
      if (locationId) params.set('locationId', locationId)

      const res = await apiFetch(`/api/search?${params.toString()}`)
      const json = await res.json().catch(() => null)

      if (cancelled) return

      if (!res.ok || !json?.data) {
        setError('Could not load search results. Please try again.')
        setResults(null)
        setLoading(false)
        return
      }

      setResults(json.data as SearchResponse)
      setLoading(false)
    }

    void loadResults()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, locationId])

  function updateParams(next: { q?: string; type?: SearchTab; locationId?: string }) {
    const params = new URLSearchParams(searchParams.toString())

    if (next.q !== undefined) {
      if (next.q.trim().length > 0) params.set('q', next.q.trim())
      else params.delete('q')
    }

    if (next.type !== undefined) {
      if (next.type === 'all') params.delete('type')
      else params.set('type', next.type)
    }

    if (next.locationId !== undefined) {
      if (next.locationId) params.set('locationId', next.locationId)
      else params.delete('locationId')
    }

    const queryString = params.toString()
    router.push(queryString ? `/search?${queryString}` : '/search')
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateParams({ q: query })
  }

  const visibleCounts = results?.totalByType ?? {
    skills: 0,
    tools: 0,
    events: 0,
    drives: 0,
    food: 0,
  }

  const allCount = visibleCounts.skills + visibleCounts.tools + visibleCounts.events + visibleCounts.drives + visibleCounts.food

  const hasAnyResults = allCount > 0

  const sections = useMemo(() => {
    if (!results) return []

    return [
      { key: 'skills' as const, title: 'Skills', items: results.skills },
      { key: 'tools' as const, title: 'Tools', items: results.tools },
      { key: 'events' as const, title: 'Events', items: results.events },
      { key: 'drives' as const, title: 'Drives', items: results.drives },
      { key: 'food' as const, title: 'Food', items: results.food },
    ]
  }, [results])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Search</h1>
        <p className="mt-1 text-sm text-gray-600">Find listings, events, drives, and food shares across your neighborhood.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search all modules"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <LocationFilter
          value={locationId}
          onChange={(nextLocationId) => {
            setLocationId(nextLocationId)
            updateParams({ locationId: nextLocationId })
          }}
        />
        <button
          type="submit"
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const count = tab === 'all' ? allCount : visibleCounts[tab]
          const isActive = activeType === tab

          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveType(tab)
                updateParams({ type: tab })
              }}
              className={`rounded-full border px-3 py-1 text-sm transition ${isActive ? 'border-green-700 bg-green-700 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-green-400'}`}
            >
              {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
            </button>
          )
        })}
      </div>

      {query.trim().length < 2 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
          Enter at least 2 characters to start searching.
        </div>
      )}

      {debouncedQuery.length >= 2 && loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
          Loading results...
        </div>
      )}

      {debouncedQuery.length >= 2 && !loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {debouncedQuery.length >= 2 && !loading && !error && !hasAnyResults && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
          No results found. Try fewer keywords or clear the neighborhood filter.
        </div>
      )}

      {debouncedQuery.length >= 2 && !loading && !error && hasAnyResults && activeType === 'all' && (
        <div className="space-y-6">
          {sections.filter((section) => section.items.length > 0).map((section) => (
            <section key={section.key} className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
              <SearchResultsGrid>
                {section.key === 'skills' && renderSkills(section.items)}
                {section.key === 'tools' && renderTools(section.items)}
                {section.key === 'events' && renderEvents(section.items)}
                {section.key === 'drives' && renderDrives(section.items)}
                {section.key === 'food' && renderFood(section.items)}
              </SearchResultsGrid>
            </section>
          ))}
        </div>
      )}

      {debouncedQuery.length >= 2 && !loading && !error && hasAnyResults && activeType !== 'all' && (
        (results?.[activeType]?.length ?? 0) > 0 ? (
          <SearchResultsGrid>
            {activeType === 'skills' && renderSkills(results?.skills ?? [])}
            {activeType === 'tools' && renderTools(results?.tools ?? [])}
            {activeType === 'events' && renderEvents(results?.events ?? [])}
            {activeType === 'drives' && renderDrives(results?.drives ?? [])}
            {activeType === 'food' && renderFood(results?.food ?? [])}
          </SearchResultsGrid>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
            No {activeType} match this search.
          </div>
        )
      )}
    </div>
  )
}
