import { useState } from 'react'
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRating, ratingsKeys, type RatingContextType } from '../../../lib/queries/ratings'
import { useToast } from '../../../lib/toast'

type Props = {
  viewerId: string
  contextType: RatingContextType
  contextId: string
  ratedUserId: string
  ratedUserName: string
  visible: boolean
  onClose: () => void
}

function errorMessage(code: string) {
  const map: Record<string, string> = {
    CONTEXT_NOT_TERMINAL: 'This exchange is not complete yet.',
    NOT_A_PARTICIPANT: 'You cannot rate this exchange.',
    DUPLICATE_RATING: 'You already rated this exchange.',
    TOO_MANY_REQUESTS: 'Too many attempts. Please wait a bit.',
  }
  return map[code] ?? 'Could not submit rating.'
}

export function RatingModal({
  viewerId,
  contextType,
  contextId,
  ratedUserId,
  ratedUserName,
  visible,
  onClose,
}: Props) {
  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      createRating({
        contextType,
        contextId,
        ratedUserId,
        score,
        comment,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ratingsKeys.check(viewerId, contextType, contextId) })
      await queryClient.invalidateQueries({ queryKey: ratingsKeys.all })
      showToast({ message: `Rating submitted for ${ratedUserName}.`, variant: 'success' })
      setComment('')
      setScore(5)
      onClose()
    },
    onError: (error) => {
      const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      showToast({ message: errorMessage(code), variant: 'error' })
    },
  })

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>Rate {ratedUserName}</Text>

          <View style={styles.starsRow}>
            {Array.from({ length: 5 }).map((_, index) => {
              const star = index + 1
              const active = star <= score
              return (
                <Pressable
                  key={star}
                  onPress={() => setScore(star)}
                  style={styles.starButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Rate ${star} stars`}
                >
                  <Text style={[styles.star, active ? styles.starActive : styles.starInactive]}>★</Text>
                </Pressable>
              )
            })}
          </View>

          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={(text) => setComment(text.slice(0, 500))}
            multiline
            numberOfLines={4}
            maxLength={500}
            placeholder="Write an optional review"
            textAlignVertical="top"
          />
          <Text style={styles.counter}>{comment.length}/500</Text>

          <View style={styles.actions}>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => { setComment(''); setScore(5); onClose() }}
              disabled={mutation.isPending}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, mutation.isPending && styles.submitBtnDisabled]}
              onPress={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              <Text style={styles.submitBtnText}>{mutation.isPending ? 'Submitting...' : 'Submit'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  starButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  star: {
    fontSize: 30,
    lineHeight: 34,
  },
  starActive: {
    color: '#d97706',
  },
  starInactive: {
    color: '#fcd34d',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    minHeight: 96,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  counter: {
    textAlign: 'right',
    fontSize: 12,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  submitBtn: {
    borderRadius: 8,
    backgroundColor: '#b45309',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
})
