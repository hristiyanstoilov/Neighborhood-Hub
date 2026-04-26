import { useEffect, useState } from 'react'
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet } from 'react-native'
import { apiFetch } from '../../../lib/api'

const LEVEL_LABELS = ['', 'Newcomer', 'Helper', 'Contributor', 'Champion', 'Legend']
const LEVEL_COLORS = ['', '#6b7280', '#15803d', '#1d4ed8', '#7c3aed', '#b45309']
const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

type Entry = {
  userId:      string
  totalPoints: number
  level:       number
  name:        string | null
  avatarUrl:   string | null
}

export default function LeaderboardScreen() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    apiFetch('/api/leaderboard')
      .then((r) => r.json())
      .then((j) => setEntries(Array.isArray(j?.data) ? j.data : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load leaderboard.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Top neighbors by Neighbor Score</Text>
      </View>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.userId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No entries yet. Start sharing to earn points!</Text>
        }
        renderItem={({ item, index }) => {
          const rank  = index + 1
          const color = LEVEL_COLORS[item.level] ?? '#6b7280'
          const medal = MEDALS[rank]
          const initials = (item.name ?? '?')[0].toUpperCase()
          return (
            <View style={styles.row}>
              <Text style={styles.rank}>{medal ?? `#${rank}`}</Text>
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: color }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name ?? 'Anonymous'}</Text>
                <Text style={styles.level}>{LEVEL_LABELS[item.level]}</Text>
              </View>
              <View style={styles.pts}>
                <Text style={styles.ptsNumber}>{item.totalPoints}</Text>
                <Text style={styles.ptsLabel}>pts</Text>
              </View>
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f3f4f6' },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  errorText:      { fontSize: 14, color: '#dc2626' },
  header:         { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title:          { fontSize: 20, fontWeight: '700', color: '#111827' },
  subtitle:       { fontSize: 12, color: '#6b7280', marginTop: 2 },
  list:           { padding: 12, gap: 8 },
  empty:          { textAlign: 'center', color: '#9ca3af', fontSize: 14, paddingTop: 40 },
  row:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb', gap: 10 },
  rank:           { width: 32, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#6b7280' },
  avatar:         { width: 38, height: 38, borderRadius: 19 },
  avatarFallback: { justifyContent: 'center', alignItems: 'center' },
  avatarText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  info:           { flex: 1 },
  name:           { fontSize: 14, fontWeight: '600', color: '#111827' },
  level:          { fontSize: 11, color: '#6b7280', marginTop: 1 },
  pts:            { alignItems: 'flex-end' },
  ptsNumber:      { fontSize: 14, fontWeight: '700', color: '#111827' },
  ptsLabel:       { fontSize: 10, color: '#9ca3af' },
})
