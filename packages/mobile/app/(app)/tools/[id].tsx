import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../../contexts/auth'
import { apiFetch } from '../../../lib/api'
import { fetchToolDetail, toolsKeys } from '../../../lib/queries/tools'
import { TOOL_STATUS_COLORS, TOOL_STATUS_LABELS } from '../../../lib/format'

const CONDITION_LABELS: Record<string, string> = {
  new:  'New',
  good: 'Good',
  fair: 'Fair',
  worn: 'Worn',
}

export default function ToolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const toolQuery = useQuery({
    queryKey: toolsKeys.detail(id ?? ''),
    queryFn:  () => fetchToolDetail(id as string),
    enabled:  Boolean(id),
  })

  const reserveMutation = useMutation({
    mutationFn: async ({ toolId, startDate, endDate, notes }: { toolId: string; startDate: string; endDate: string; notes?: string }) => {
      const res = await apiFetch('/api/tool-reservations', {
        method: 'POST',
        body: JSON.stringify({ toolId, startDate, endDate, notes }),
      })
      const json = await res.json()
      if (!res.ok) {
        const ERROR_MESSAGES: Record<string, string> = {
          TOOL_NOT_AVAILABLE:       'This tool is no longer available.',
          CANNOT_RESERVE_OWN_TOOL:  'You cannot reserve your own tool.',
          DUPLICATE_RESERVATION:    'You already have an active reservation for this tool.',
          UNVERIFIED_EMAIL:         'Please verify your email first.',
          VALIDATION_ERROR:         'Invalid dates. Please check your input.',
          TOO_MANY_REQUESTS:        'Too many requests. Please wait.',
        }
        throw new Error(ERROR_MESSAGES[json.error] ?? 'Something went wrong.')
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      Alert.alert('Reservation sent!', 'Your request has been sent to the owner.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    },
    onError: (err: Error) => {
      Alert.alert('Could not reserve', err.message)
    },
  })

  function promptReserve() {
    if (!user) {
      Alert.alert('Login required', 'Please log in to reserve tools.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/(auth)/login' as never) },
      ])
      return
    }

    if (!user.emailVerifiedAt) {
      Alert.alert('Email not verified', 'Please verify your email before reserving tools.')
      return
    }

    // Alert.prompt is iOS only — on Android we fall back to a simpler confirm dialog.
    // A full date picker would require a third-party package (e.g. @react-native-community/datetimepicker).
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Start date',
        'Enter start date (YYYY-MM-DD)',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Next',
            onPress: (start) => {
              if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) {
                Alert.alert('Invalid date', 'Please use YYYY-MM-DD format.')
                return
              }
              Alert.prompt(
                'End date',
                'Enter end date (YYYY-MM-DD)',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reserve',
                    onPress: (end) => {
                      if (!end || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
                        Alert.alert('Invalid date', 'Please use YYYY-MM-DD format.')
                        return
                      }
                      reserveMutation.mutate({ toolId: tool.id, startDate: start, endDate: end })
                    },
                  },
                ],
                'plain-text',
                start,
              )
            },
          },
        ],
        'plain-text',
      )
    } else {
      // Android: show a simple confirmation — full date pickers need a native package
      const today = new Date().toISOString().slice(0, 10)
      const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      Alert.alert(
        'Reserve this tool',
        `Send a reservation request?\n\nDefault: ${today} → ${weekLater}\n(Use the web app to select custom dates)`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send request', onPress: () => reserveMutation.mutate({ toolId: tool.id, startDate: today, endDate: weekLater }) },
        ],
      )
    }
  }

  if (toolQuery.isLoading) {
    return (
      <View style={styles.centerFull}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    )
  }

  if (toolQuery.isError || !toolQuery.data) {
    return (
      <View style={styles.centerFull}>
        <Text style={styles.errorText}>Could not load this tool.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const tool = toolQuery.data
  const isOwner = user?.id === tool.ownerId
  const isAvailable = tool.status === 'available'
  const statusStyle = TOOL_STATUS_COLORS[tool.status] ?? TOOL_STATUS_COLORS.available
  const statusLabel = TOOL_STATUS_LABELS[tool.status] ?? tool.status

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color="#6b7280" />
        <Text style={styles.backText}>Tools</Text>
      </TouchableOpacity>

      {/* Image */}
      {tool.imageUrl && (
        <Image source={{ uri: tool.imageUrl }} style={styles.image} />
      )}

      {/* Title + status */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{tool.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Description */}
      {tool.description && (
        <Text style={styles.description}>{tool.description}</Text>
      )}

      {/* Details grid */}
      <View style={styles.detailsGrid}>
        <DetailRow label="Condition"  value={tool.condition ? (CONDITION_LABELS[tool.condition] ?? tool.condition) : '—'} />
        <DetailRow label="Category"   value={tool.categoryLabel ?? '—'} />
        <DetailRow
          label="Location"
          value={tool.locationNeighborhood ? `${tool.locationNeighborhood}, ${tool.locationCity}` : '—'}
        />
        <DetailRow label="Listed by"  value={tool.ownerName ?? 'Anonymous'} />
      </View>

      {/* Actions */}
      {!isOwner && (
        <View style={styles.actionArea}>
          {isAvailable ? (
            <TouchableOpacity
              style={[styles.reserveBtn, reserveMutation.isPending && styles.reserveBtnDisabled]}
              onPress={promptReserve}
              disabled={reserveMutation.isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.reserveBtnText}>
                {reserveMutation.isPending ? 'Sending…' : 'Reserve this tool'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.unavailableText}>This tool is currently not available for reservation.</Text>
          )}
        </View>
      )}
    </ScrollView>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  scroll:           { flex: 1, backgroundColor: '#f9fafb' },
  content:          { paddingBottom: 40 },
  centerFull:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText:      { fontSize: 15, color: '#6b7280' },
  errorText:        { fontSize: 15, color: '#6b7280', marginBottom: 16, textAlign: 'center' },
  backBtn:          { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#f3f4f6', borderRadius: 8 },
  backBtnText:      { fontSize: 14, color: '#374151', fontWeight: '500' },
  backRow:          { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 16, paddingTop: 56 },
  backText:         { fontSize: 14, color: '#6b7280' },
  image:            { width: '100%', height: 220 },
  titleRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, gap: 12 },
  title:            { flex: 1, fontSize: 20, fontWeight: '700', color: '#111827' },
  statusBadge:      { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:       { fontSize: 12, fontWeight: '600' },
  description:      { paddingHorizontal: 16, fontSize: 14, color: '#4b5563', lineHeight: 22, marginBottom: 8 },
  detailsGrid:      { margin: 16, backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  detailRow:        { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  detailLabel:      { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  detailValue:      { fontSize: 13, color: '#111827', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  actionArea:       { marginHorizontal: 16, marginTop: 8 },
  reserveBtn:       { backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  reserveBtnDisabled: { opacity: 0.6 },
  reserveBtnText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
  unavailableText:  { textAlign: 'center', fontSize: 14, color: '#9ca3af', paddingVertical: 12 },
})
