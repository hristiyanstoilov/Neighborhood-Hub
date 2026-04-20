import { useMemo, useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import { useToast } from '../../../lib/toast'
import { dmKeys, fetchMessages, sendMessage } from '../../../lib/queries/direct-messages'
import { formatDateTime } from '../../../lib/format'

export default function MessagesThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const conversationId = typeof id === 'string' ? id : ''
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [text, setText] = useState('')

  const query = useInfiniteQuery({
    queryKey: dmKeys.messages(conversationId),
    queryFn: ({ pageParam }) => fetchMessages(conversationId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore || lastPage.messages.length === 0) return undefined
      return lastPage.messages[lastPage.messages.length - 1]?.createdAt
    },
    enabled: conversationId.length > 0,
    refetchInterval: 15_000,
  })

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendMessage(conversationId, body),
    onSuccess: () => {
      setText('')
      void queryClient.invalidateQueries({ queryKey: dmKeys.messages(conversationId) })
      if (user?.id) {
        void queryClient.invalidateQueries({ queryKey: dmKeys.conversations(user.id) })
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'SEND_FAILED'
      showToast({ variant: 'error', message })
    },
  })

  const ordered = useMemo(() => {
    const newestFirst = query.data?.pages.flatMap((page) => page.messages) ?? []
    return [...newestFirst].reverse()
  }, [query.data])

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {query.hasNextPage ? (
        <Pressable
          style={styles.loadOlder}
          onPress={() => void query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
        >
          <Text style={styles.loadOlderText}>{query.isFetchingNextPage ? 'Loading...' : 'Load older messages'}</Text>
        </Pressable>
      ) : null}

      <FlatList
        data={ordered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const own = item.senderId === user?.id
          return (
            <View style={[styles.messageRow, own ? styles.messageRowOwn : styles.messageRowOther]}>
              <View style={[styles.bubble, own ? styles.bubbleOwn : styles.bubbleOther]}>
                <Text style={[styles.body, own ? styles.bodyOwn : styles.bodyOther]}>{item.body}</Text>
                <Text style={[styles.time, own ? styles.timeOwn : styles.timeOther]}>{formatDateTime(item.createdAt)}</Text>
              </View>
            </View>
          )
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write a message"
          style={styles.input}
          multiline
          maxLength={2000}
        />
        <Pressable
          style={styles.sendBtn}
          onPress={() => {
            const body = text.trim()
            if (!body) return
            sendMutation.mutate(body)
          }}
          disabled={sendMutation.isPending}
        >
          <Text style={styles.sendBtnText}>{sendMutation.isPending ? '...' : 'Send'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loadOlder: { alignItems: 'center', paddingVertical: 10 },
  loadOlderText: { fontSize: 13, color: '#15803d', fontWeight: '600' },
  listContent: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  messageRow: { flexDirection: 'row' },
  messageRowOwn: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  bubbleOwn: { backgroundColor: '#111827' },
  bubbleOther: { backgroundColor: '#e5e7eb' },
  body: { fontSize: 14 },
  bodyOwn: { color: '#ffffff' },
  bodyOther: { color: '#111827' },
  time: { marginTop: 4, fontSize: 11 },
  timeOwn: { color: '#d1d5db' },
  timeOther: { color: '#6b7280' },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 10,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxHeight: 120,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendBtnText: { color: '#fff', fontWeight: '700' },
})
