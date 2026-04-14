import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'

type Category = { id: string; slug: string; label: string }
type Location = { id: string; city: string; neighborhood: string }

type SkillsHeaderProps = {
  userExists: boolean
  unreadCount: number
  showFilters: boolean
  activeFilterCount: number
  search: string
  categories: Category[]
  locations: Location[]
  filterCategoryId: string | null
  filterLocationId: string | null
  hasActiveFilters: boolean
  onSearchChange: (text: string) => void
  onToggleFilters: () => void
  onCategoryChange: (id: string | null) => void
  onLocationChange: (id: string | null) => void
  onClearFilters: () => void
  onOpenNotifications: () => void
  onOpenChat: () => void
  onOpenRadar: () => void
  onOpenLogin: () => void
}

export function SkillsHeader({
  userExists,
  unreadCount,
  showFilters,
  activeFilterCount,
  search,
  categories,
  locations,
  filterCategoryId,
  filterLocationId,
  hasActiveFilters,
  onSearchChange,
  onToggleFilters,
  onCategoryChange,
  onLocationChange,
  onClearFilters,
  onOpenNotifications,
  onOpenChat,
  onOpenRadar,
  onOpenLogin,
}: SkillsHeaderProps) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Skills</Text>
        <View style={styles.headerActions}>
          {userExists ? (
            <>
              <TouchableOpacity onPress={onOpenNotifications} style={styles.bellWrapper}>
                <Text style={styles.bellIcon}>🔔</Text>
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={onOpenChat}>
                <Text style={styles.headerLink}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onOpenRadar}>
                <Text style={styles.headerLink}>Radar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={onOpenLogin}>
              <Text style={styles.headerLink}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={onSearchChange}
            placeholder="Search skills..."
            maxLength={100}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <TouchableOpacity
          style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
          onPress={onToggleFilters}
        >
          <Text style={[styles.filterToggleText, showFilters && styles.filterToggleTextActive]}>
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          {categories.length > 0 && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.chip, !filterCategoryId && styles.chipActive]}
                  onPress={() => onCategoryChange(null)}
                >
                  <Text style={[styles.chipText, !filterCategoryId && styles.chipTextActive]}>All</Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.chip, filterCategoryId === category.id && styles.chipActive]}
                    onPress={() => onCategoryChange(category.id)}
                  >
                    <Text style={[styles.chipText, filterCategoryId === category.id && styles.chipTextActive]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {locations.length > 0 && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>Location</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.chip, !filterLocationId && styles.chipActive]}
                  onPress={() => onLocationChange(null)}
                >
                  <Text style={[styles.chipText, !filterLocationId && styles.chipTextActive]}>All</Text>
                </TouchableOpacity>
                {locations.map((location) => (
                  <TouchableOpacity
                    key={location.id}
                    style={[styles.chip, filterLocationId === location.id && styles.chipActive]}
                    onPress={() => onLocationChange(location.id)}
                  >
                    <Text style={[styles.chipText, filterLocationId === location.id && styles.chipTextActive]}>
                      {location.neighborhood}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {hasActiveFilters && (
            <TouchableOpacity onPress={onClearFilters} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear all filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    flexWrap: 'wrap',
    gap: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  headerLink: { fontSize: 13, color: '#15803d', fontWeight: '500' },
  bellWrapper: { position: 'relative', padding: 2 },
  bellIcon: { fontSize: 16 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700', lineHeight: 11 },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 6,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 9,
  },
  filterToggle: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  filterToggleActive: { backgroundColor: '#15803d', borderColor: '#15803d' },
  filterToggleText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  filterToggleTextActive: { color: '#fff' },
  filterPanel: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
    gap: 12,
  },
  filterGroup: { gap: 8 },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    marginRight: 6,
  },
  chipActive: { backgroundColor: '#15803d', borderColor: '#15803d' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  clearBtn: { alignSelf: 'flex-start' },
  clearBtnText: { fontSize: 13, color: '#15803d', fontWeight: '500' },
})