import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import {
  getSkillRequestActionErrorMessage,
  skillRequestsKeys,
  type RequestAction,
  type SkillRequestRow,
  updateSkillRequestAction,
} from '../lib/queries/skill-requests'
import { useToast } from '../lib/toast'

interface Props {
  request: SkillRequestRow
  viewerId: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#fef3c7', text: '#92400e' },
  accepted:  { bg: '#d1fae5', text: '#065f46' },
  rejected:  { bg: '#fee2e2', text: '#991b1b' },
  completed: { bg: '#dbeafe', text: '#1e40af' },
  cancelled: { bg: '#f3f4f6', text: '#6b7280' },
}

const TERMINAL = ['rejected', 'completed', 'cancelled']

const ACTION_TOASTS: Record<RequestAction, string> = {
  accept:   'Request accepted',
  reject:   'Request rejected',
  complete: 'Session marked as completed',
  cancel:   'Request cancelled',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function RequestCard({ request, viewerId }: Props) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const mutation = useMutation({
    mutationFn: updateSkillRequestAction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: skillRequestsKeys.all })
    },
  })

  const isOwner = request.userToId === viewerId
  const isRequester = request.userFromId === viewerId
  const otherName = isOwner ? request.requesterName : request.ownerName
  const statusStyle = STATUS_COLORS[request.status] ?? STATUS_COLORS.cancelled
  const isTerminal = TERMINAL.includes(request.status)

  async function performAction(action: RequestAction, cancellationReason?: string) {
    try {
      await mutation.mutateAsync({
        requestId: request.id,
        action,
        cancellationReason,
      })
      showToast({ message: ACTION_TOASTS[action], variant: 'success' })
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      Alert.alert('Error', getSkillRequestActionErrorMessage(errorCode))
    }
  }

  function confirmCancel() {
    Alert.alert(
      'Cancel request',
      'Please provide a reason:',
      [
        { text: 'No, keep it', style: 'cancel' },
        {
          text: 'Cancel request',
          style: 'destructive',
          onPress: () => {
            // On mobile we use a fixed reason since Alert.prompt is iOS-only
            // and this keeps cross-platform consistency
            performAction('cancel', 'Cancelled by user')
          },
        },
      ]
    )
  }

  function confirmAction(action: 'accept' | 'reject' | 'complete') {
    const labels: Record<string, { title: string; message: string }> = {
      accept:   { title: 'Accept request',   message: 'Accept this skill request?' },
      reject:   { title: 'Reject request',   message: 'Reject this skill request?' },
      complete: { title: 'Mark complete',    message: 'Mark this session as completed?' },
    }
    const { title, message } = labels[action]
    Alert.alert(title, message, [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: () => performAction(action) },
    ])
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.skillTitle} numberOfLines={1}>{request.skillTitle}</Text>
          <Text style={styles.otherParty}>
            {isOwner ? 'From' : 'To'}: {otherName ?? 'Unknown'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.badgeText, { color: statusStyle.text }]}>
            {request.status}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.detailLabel}>Start</Text>
        <Text style={styles.detailValue}>{formatDate(request.scheduledStart)}</Text>
        <Text style={styles.detailLabel}>End</Text>
        <Text style={styles.detailValue}>{formatDate(request.scheduledEnd)}</Text>
        <Text style={styles.detailLabel}>Meeting</Text>
        <Text style={styles.detailValue}>{request.meetingType.replace(/_/g, ' ')}</Text>
      </View>

      {request.notes ? (
        <Text style={styles.notes}>{request.notes}</Text>
      ) : null}

      {request.cancellationReason ? (
        <Text style={styles.cancelReason}>Reason: {request.cancellationReason}</Text>
      ) : null}

      {/* Action buttons */}
      {!isTerminal && !mutation.isPending && (
        <View style={styles.actions}>
          {isOwner && request.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.btn, styles.btnGreen]}
                onPress={() => confirmAction('accept')}
              >
                <Text style={styles.btnTextWhite}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnRed]}
                onPress={() => confirmAction('reject')}
              >
                <Text style={styles.btnTextWhite}>Reject</Text>
              </TouchableOpacity>
            </>
          )}

          {request.status === 'accepted' && (
            <TouchableOpacity
              style={[styles.btn, styles.btnBlue]}
              onPress={() => confirmAction('complete')}
            >
              <Text style={styles.btnTextWhite}>Mark complete</Text>
            </TouchableOpacity>
          )}

          {((isRequester && request.status === 'pending') || request.status === 'accepted') && (
            <TouchableOpacity
              style={[styles.btn, styles.btnGray]}
              onPress={confirmCancel}
            >
              <Text style={styles.btnTextGray}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {mutation.isPending && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#15803d" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  headerLeft: {
    flex: 1,
  },
  skillTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  otherParty: {
    fontSize: 12,
    color: '#6b7280',
  },
  badge: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 11,
    color: '#9ca3af',
    width: 50,
  },
  detailValue: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
    minWidth: 120,
    marginBottom: 2,
  },
  notes: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
    paddingLeft: 8,
    marginBottom: 8,
  },
  cancelReason: {
    fontSize: 12,
    color: '#dc2626',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  btnGreen: { backgroundColor: '#15803d' },
  btnRed:   { backgroundColor: '#dc2626' },
  btnBlue:  { backgroundColor: '#2563eb' },
  btnGray:  { borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  btnTextWhite: { color: '#fff', fontSize: 13, fontWeight: '600' },
  btnTextGray:  { color: '#374151', fontSize: 13, fontWeight: '500' },
  loadingRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
})
