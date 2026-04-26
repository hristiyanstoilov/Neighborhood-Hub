import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import MapView, { Marker, Callout } from 'react-native-maps'
import { useRouter } from 'expo-router'
import { apiFetch } from '../../../lib/api'

type MarkerType = 'skill' | 'tool' | 'food_share' | 'event'

type MapMarker = {
  id: string
  type: MarkerType
  title: string
  lat: number
  lng: number
  status: string
  neighborhood: string
}

const TYPE_CONFIG: Record<MarkerType, { color: string; label: string; route: string }> = {
  skill:      { color: '#15803d', label: 'Skill',  route: '/(app)/skills' },
  tool:       { color: '#1d4ed8', label: 'Tool',   route: '/(app)/tools' },
  food_share: { color: '#ea580c', label: 'Food',   route: '/(app)/food' },
  event:      { color: '#7c3aed', label: 'Event',  route: '/(app)/events' },
}

// Sofia, Bulgaria
const SOFIA = { latitude: 42.698, longitude: 23.322, latitudeDelta: 0.12, longitudeDelta: 0.12 }

type FilterType = MarkerType | 'all'

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all',        label: 'All' },
  { value: 'skill',      label: 'Skills' },
  { value: 'tool',       label: 'Tools' },
  { value: 'food_share', label: 'Food' },
  { value: 'event',      label: 'Events' },
]

export default function MapScreen() {
  const router = useRouter()
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    apiFetch('/api/map')
      .then((res) => res.json())
      .then((json) => {
        setMarkers(Array.isArray(json?.data) ? json.data : [])
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const visible = filter === 'all' ? markers : markers.filter((m) => m.type === filter)

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
        <Text style={styles.errorText}>Could not load map. Please try again.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <View style={styles.filterBar}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, filter === f.value && styles.chipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.chipText, filter === f.value && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <MapView style={styles.map} initialRegion={SOFIA} showsUserLocation>
        {visible.map((m) => {
          const cfg = TYPE_CONFIG[m.type]
          return (
            <Marker
              key={`${m.type}-${m.id}`}
              coordinate={{ latitude: m.lat, longitude: m.lng }}
              pinColor={cfg.color}
            >
              <Callout onPress={() => router.push(`${cfg.route}/${m.id}` as never)}>
                <View style={styles.callout}>
                  <View style={[styles.typeBadge, { backgroundColor: cfg.color }]}>
                    <Text style={styles.typeBadgeText}>{cfg.label}</Text>
                  </View>
                  <Text style={styles.calloutTitle} numberOfLines={2}>{m.title}</Text>
                  <Text style={styles.calloutNeighborhood}>{m.neighborhood}</Text>
                  <Text style={styles.calloutLink}>Tap to view →</Text>
                </View>
              </Callout>
            </Marker>
          )
        })}
      </MapView>

      <View style={styles.countBar}>
        <Text style={styles.countText}>{visible.length} items shown</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  errorText: { fontSize: 14, color: '#dc2626' },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipActive:     { backgroundColor: '#15803d', borderColor: '#15803d' },
  chipText:       { fontSize: 12, color: '#374151' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  map:            { flex: 1 },
  callout:        { width: 180, padding: 8 },
  typeBadge:      { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 4 },
  typeBadgeText:  { color: '#fff', fontSize: 10, fontWeight: '600' },
  calloutTitle:       { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 2 },
  calloutNeighborhood: { fontSize: 11, color: '#6b7280', marginBottom: 6 },
  calloutLink:    { fontSize: 11, color: '#15803d', fontWeight: '600' },
  countBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  countText: { fontSize: 11, color: '#9ca3af', textAlign: 'right' },
})
