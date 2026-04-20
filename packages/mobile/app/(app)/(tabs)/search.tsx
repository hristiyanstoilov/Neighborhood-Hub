import { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { humanizeValue, formatDateOnly } from '../../../lib/format'
import {
  fetchSearchResults,
  searchKeys,
  type DriveSearchResult,
  type EventSearchResult,
  type FoodSearchResult,
  type SearchResultsData,
  type SkillSearchResult,
  type ToolSearchResult,
} from '../../../lib/queries/search'

type SearchTab = 'all' | 'skills' | 'tools' | 'events' | 'drives' | 'food'
type SearchCard =
  | { id: string; tab: 'skills'; title: string; subtitle: string; meta: string }
  | { id: string; tab: 'tools'; title: string; subtitle: string; meta: string }
  | { id: string; tab: 'events'; title: string; subtitle: string; meta: string }
  | { id: string; tab: 'drives'; title: string; subtitle: string; meta: string }
  | { id: string; tab: 'food'; title: string; subtitle: string; meta: string }

const tabs: SearchTab[] = ['all', 'skills', 'tools', 'events', 'drives', 'food']

function toSkillCard(item: SkillSearchResult): SearchCard {
  return {
    id: item.id,
    tab: 'skills',
    title: item.title,
    subtitle: item.ownerName ?? 'Neighbor',
    meta: humanizeValue(item.status),
  }
}

function toToolCard(item: ToolSearchResult): SearchCard {
  return {
    id: item.id,
    tab: 'tools',
    title: item.title,
    subtitle: item.ownerName ?? 'Neighbor',
    meta: `${humanizeValue(item.status)} • ${humanizeValue(item.condition)}`,
  }
}

function toEventCard(item: EventSearchResult): SearchCard {
  return {
    id: item.id,
    tab: 'events',
    title: item.title,
    subtitle: item.address ?? 'Neighborhood event',
    meta: `${humanizeValue(item.status)} • ${formatDateOnly(item.startsAt)}`,
  }
}

function toDriveCard(item: DriveSearchResult): SearchCard {
  return {
    id: item.id,
    tab: 'drives',
    title: item.title,
    subtitle: humanizeValue(item.driveType),
    meta: item.deadline ? `Deadline ${formatDateOnly(item.deadline)}` : humanizeValue(item.status),
  }
}

function toFoodCard(item: FoodSearchResult): SearchCard {
  return {
    id: item.id,
    tab: 'food',
    title: item.title,
    subtitle: `Quantity: ${item.quantity}`,
    meta: humanizeValue(item.status),
  }
}

function buildCards(tab: SearchTab, data: SearchResultsData | undefined): SearchCard[] {
  if (!data) return []

  if (tab === 'skills') return data.skills.map(toSkillCard)
  if (tab === 'tools') return data.tools.map(toToolCard)
  if (tab === 'events') return data.events.map(toEventCard)
  if (tab === 'drives') return data.drives.map(toDriveCard)
  if (tab === 'food') return data.food.map(toFoodCard)

  return [
    ...data.skills.map(toSkillCard),
    ...data.tools.map(toToolCard),
    ...data.events.map(toEventCard),
    ...data.drives.map(toDriveCard),
    ...data.food.map(toFoodCard),
  ]
}

export default function SearchScreen() {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')
  const [debouncedText, setDebouncedText] = useState('')
  const [activeTab, setActiveTab] = useState<SearchTab>('all')

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedText(searchText.trim())
    }, 400)

    return () => clearTimeout(timeout)
  }, [searchText])

  const { data, isLoading, isError } = useQuery({
    queryKey: searchKeys.results(debouncedText),
    queryFn: () => fetchSearchResults({ q: debouncedText }),
    enabled: debouncedText.length >= 2,
  })

  const cards = useMemo(() => buildCards(activeTab, data), [activeTab, data])

  const counts = data?.totalByType ?? {
    skills: 0,
    tools: 0,
    events: 0,
    drives: 0,
    food: 0,
  }

  const allCount = counts.skills + counts.tools + counts.events + counts.drives + counts.food

  function openCard(card: SearchCard) {
    if (card.tab === 'skills') router.push(`/(app)/skills/${card.id}`)
    if (card.tab === 'tools') router.push(`/(app)/tools/${card.id}`)
    if (card.tab === 'events') router.push(`/(app)/events/${card.id}`)
    if (card.tab === 'drives') router.push(`/(app)/drives/${card.id}`)
    if (card.tab === 'food') router.push(`/(app)/food/${card.id}`)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <Text style={styles.subtitle}>Search across skills, tools, events, drives, and food shares.</Text>

      <TextInput
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Type at least 2 characters"
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {tabs.map((tab) => {
          const count = tab === 'all' ? allCount : counts[tab]
          const active = activeTab === tab

          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabChip, active ? styles.tabChipActive : styles.tabChipIdle]}
            >
              <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextIdle]}>
                {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {debouncedText.length < 2 && (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>Start typing to discover neighborhood content.</Text>
        </View>
      )}

      {debouncedText.length >= 2 && isLoading && (
        <View style={styles.stateBox}>
          <ActivityIndicator color="#15803d" />
          <Text style={styles.stateText}>Searching...</Text>
        </View>
      )}

      {debouncedText.length >= 2 && !isLoading && isError && (
        <View style={styles.stateBox}>
          <Text style={styles.stateError}>Could not load results. Try again.</Text>
        </View>
      )}

      {debouncedText.length >= 2 && !isLoading && !isError && cards.length === 0 && (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>Nothing found. Try a broader keyword.</Text>
        </View>
      )}

      {debouncedText.length >= 2 && !isLoading && !isError && cards.length > 0 && (
        <FlatList
          data={cards}
          keyExtractor={(item) => `${item.tab}:${item.id}`}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => openCard(item)}>
              <Text style={styles.cardType}>{item.tab.toUpperCase()}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              <Text style={styles.cardMeta}>{item.meta}</Text>
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: '#4b5563',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  tabsRow: {
    gap: 8,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tabChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tabChipActive: {
    borderColor: '#15803d',
    backgroundColor: '#15803d',
  },
  tabChipIdle: {
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabTextIdle: {
    color: '#374151',
  },
  stateBox: {
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  stateText: {
    color: '#6b7280',
  },
  stateError: {
    color: '#b91c1c',
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 10,
    paddingBottom: 28,
    gap: 10,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 4,
  },
  cardType: {
    fontSize: 10,
    color: '#15803d',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#4b5563',
  },
  cardMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
})
