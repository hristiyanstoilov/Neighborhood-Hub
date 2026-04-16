import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { TOOL_STATUS_COLORS, TOOL_STATUS_LABELS } from '../lib/format'

interface ToolCardProps {
  title: string
  ownerName: string | null
  categoryLabel: string | null
  condition: string | null
  status: string
  imageUrl?: string | null
  onPress: () => void
}

const CONDITION_LABELS: Record<string, string> = {
  new:  'New',
  good: 'Good',
  fair: 'Fair',
  worn: 'Worn',
}

export default function ToolCard({ title, ownerName, categoryLabel, condition, status, imageUrl, onPress }: ToolCardProps) {
  const statusStyle = TOOL_STATUS_COLORS[status] ?? TOOL_STATUS_COLORS.available
  const statusLabel = TOOL_STATUS_LABELS[status] ?? status

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      )}
      <View style={styles.body}>
        <View style={styles.top}>
          {categoryLabel && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{categoryLabel}</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={styles.meta}>
          {condition && (
            <Text style={styles.metaText}>{CONDITION_LABELS[condition] ?? condition}</Text>
          )}
          {ownerName && (
            <Text style={styles.metaText}>by {ownerName}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 120,
  },
  body: {
    padding: 14,
  },
  top: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: '#f0fdf4',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
})
