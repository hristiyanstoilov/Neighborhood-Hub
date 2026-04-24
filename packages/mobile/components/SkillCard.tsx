import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { mobileTheme } from '../lib/theme'

interface SkillCardProps {
  title: string
  ownerName: string | null
  category: string | null
  status: string
  imageUrl?: string | null
  onPress: () => void
}

export default function SkillCard({ title, ownerName, category, status, imageUrl, onPress }: SkillCardProps) {
  const statusStyle = mobileTheme.status.skill[status as keyof typeof mobileTheme.status.skill] ?? mobileTheme.status.skill.available

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      )}
      <View style={[styles.body]}>
      <View style={styles.top}>
        {category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{status}</Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      {ownerName && (
        <Text style={styles.owner}>by {ownerName}</Text>
      )}
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
  owner: {
    fontSize: 12,
    color: mobileTheme.colors.textMuted,
  },
})
