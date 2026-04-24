import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { TOOL_STATUS_LABELS } from '../lib/format'
import { mobileTheme } from '../lib/theme'

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
  const statusStyle = mobileTheme.status.tool[status as keyof typeof mobileTheme.status.tool] ?? mobileTheme.status.tool.available
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
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: mobileTheme.radius.md,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: mobileTheme.colors.shadow,
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
    backgroundColor: mobileTheme.colors.primarySoft,
    borderRadius: mobileTheme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 11,
    color: mobileTheme.colors.primary,
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: mobileTheme.radius.pill,
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
    color: mobileTheme.colors.textPrimary,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: mobileTheme.colors.textMuted,
  },
})
