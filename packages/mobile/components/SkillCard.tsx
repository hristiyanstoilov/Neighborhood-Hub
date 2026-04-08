import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'

interface SkillCardProps {
  title: string
  ownerName: string | null
  category: string | null
  status: string
  imageUrl?: string | null
  onPress: () => void
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  available: { bg: '#d1fae5', text: '#065f46' },
  busy: { bg: '#fef3c7', text: '#92400e' },
  retired: { bg: '#f3f4f6', text: '#6b7280' },
}

export default function SkillCard({ title, ownerName, category, status, imageUrl, onPress }: SkillCardProps) {
  const statusStyle = STATUS_COLORS[status] ?? STATUS_COLORS.available

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
  owner: {
    fontSize: 12,
    color: '#6b7280',
  },
})
