import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import MapView, { Circle, Callout, Marker, Region } from 'react-native-maps'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { AppScreen } from '../../components/AppScreen'
import { mobileTheme } from '../../lib/theme'
import { fetchRadarLocations, radarKeys } from '../../lib/queries/radar'

const SOFIA_REGION: Region = {
  latitude: 42.6977,
  longitude: 23.3219,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
}

function markerColor(count: number): string {
  if (count === 0) return '#d1d5db'
  if (count < 3)  return '#86efac'
  if (count < 8)  return '#22c55e'
  return '#15803d'
}

function markerRadius(count: number): number {
  if (count === 0) return 200
  if (count < 3)  return 350
  if (count < 8)  return 500
  return 700
}

export default function RadarScreen() {
  const router = useRouter()
  const locationsQuery = useQuery({
    queryKey: radarKeys.locations(),
    queryFn: fetchRadarLocations,
  })

  if (locationsQuery.isLoading) {
    return (
      <AppScreen backgroundColor={mobileTheme.colors.canvas}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={mobileTheme.colors.primary} />
        </View>
      </AppScreen>
    )
  }

  if (locationsQuery.isError) {
    return (
      <AppScreen backgroundColor={mobileTheme.colors.canvas}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load radar data.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => void locationsQuery.refetch()}>
            <Text style={styles.btnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </AppScreen>
    )
  }

  const locations = locationsQuery.data ?? []

  const totalSkills = locations.reduce((sum, l) => sum + l.skillCount, 0)
  const activeCount = locations.filter((l) => l.skillCount > 0).length

  return (
    <AppScreen backgroundColor={mobileTheme.colors.canvas} edges={['top']}>
      <View style={styles.container}>
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          <Text style={styles.statsNum}>{totalSkills}</Text> skills across{' '}
          <Text style={styles.statsNum}>{activeCount}</Text> neighborhoods
        </Text>
      </View>

      <MapView
        style={styles.map}
        initialRegion={SOFIA_REGION}
        showsUserLocation={false}
      >
        {locations.map((loc) => {
          const lat = parseFloat(loc.lat)
          const lng = parseFloat(loc.lng)
          if (isNaN(lat) || isNaN(lng)) return null

          return (
            <React.Fragment key={loc.id}>
              <Circle
                center={{ latitude: lat, longitude: lng }}
                radius={markerRadius(loc.skillCount)}
                fillColor={markerColor(loc.skillCount) + 'cc'}
                strokeColor={markerColor(loc.skillCount)}
                strokeWidth={1.5}
              />
              <Marker
                coordinate={{ latitude: lat, longitude: lng }}
                opacity={0}
              >
                <Callout
                  onPress={() => {
                    if (loc.skillCount > 0) {
                      router.push({ pathname: '/(app)/(tabs)/', params: { locationId: loc.id } })
                    }
                  }}
                >
                  <View style={styles.callout}>
                    <Text style={styles.calloutNeighborhood}>{loc.neighborhood}</Text>
                    <Text style={styles.calloutCity}>{loc.city}</Text>
                    {loc.skillCount > 0 ? (
                      <Text style={styles.calloutSkills}>
                        {loc.skillCount} skill{loc.skillCount !== 1 ? 's' : ''} available →
                      </Text>
                    ) : (
                      <Text style={styles.calloutEmpty}>No skills yet</Text>
                    )}
                  </View>
                </Callout>
              </Marker>
            </React.Fragment>
          )
        })}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: '#d1d5db', label: 'None' },
          { color: '#86efac', label: '1–2' },
          { color: '#22c55e', label: '3–7' },
          { color: '#15803d', label: '8+' },
        ].map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 24,
  },
  statsBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statsText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  statsNum: {
    fontWeight: '700',
    color: '#111827',
  },
  map: {
    flex: 1,
  },
  callout: {
    minWidth: 140,
    padding: 8,
  },
  calloutNeighborhood: {
    fontWeight: '700',
    fontSize: 13,
    color: '#111827',
    marginBottom: 2,
  },
  calloutCity: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  calloutSkills: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '600',
  },
  calloutEmpty: {
    fontSize: 12,
    color: '#9ca3af',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 12,
  },
  btn: {
    backgroundColor: '#15803d',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
})
