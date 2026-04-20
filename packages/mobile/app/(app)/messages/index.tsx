import { useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import { useToast } from '../../../lib/toast'
import {
  createConversation,
  dmKeys,
  fetchConversations,
  type ConversationItem,
} from '../../../lib/queries/direct-messages'
import { formatDateTime } from '../../../lib/format'

export default function MessagesListScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [otherUserId, setOtherUserId] = useState('')

  const listQuery = useQuery({
    queryKey: dmKeys.conversations(user?.id ?? 'guest'),
    queryFn: fetchConversations,
    enabled: Boolean(user),
    refetchInterval: 15_000,
  })

  const startMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: ({ conversationId }) => {
      setOtherUserId('')
      router.push(`/(app)/messages/${conversationId}`)
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'FAILED_TO_START_CONVERSATION'
      showToast({ variant: 'error', message })
    },
  })

  function openConversation(item: ConversationItem) {
    router.push(`/(app)/messages/${item.id}`)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>

      <View style={styles.newBox}>
        <TextInput
          value={otherUserId}
          onChangeText={setOtherUserId}
          placeholder="Other user ID"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          style={styles.startBtn}
          onPress={() => {
            const id = otherUserId.trim()
            if (!id) {
              showToast({ variant: 'error', message: 'User ID is required' })
              return
            }
            startMutation.mutate(id)
          }}
          disabled={startMutation.isPending}
        >
          <Text style={styles.startBtnText}>{startMutation.isPending ? 'Starting...' : 'Start'}</Text>
        </Pressable>
      </View>

      {listQuery.isLoading ? <Text style={styles.state}>Loading conversations...</Text> : null}
      {listQuery.isError ? <Text style={styles.state}>Could not load conversations.</Text> : null}

      <FlatList
        data={listQuery.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={(listQuery.data?.length ?? 0) === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={!listQuery.isLoading ? <Text style={styles.state}>No conversations yet.</Text> : null}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => openConversation(item)}>
            <View style={styles.rowTop}>
              <Text style={styles.name}>{item.otherUserName}</Text>
              {item.unreadCount > 0 ? (
                <View style={styles.badge}><Text style={styles.badgeText}>{item.unreadCount}</Text></View>
              ) : null}
            </View>
            <Text style={styles.snippet} numberOfLines={1}>
              {item.lastMessage?.body ? item.lastMessage.body.slice(0, 60) : 'No messages yet'}
            </Text>
            {item.lastMessage?.createdAt ? (
              <Text style={styles.date}>{formatDateTime(item.lastMessage.createdAt)}</Text>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 12 },
  newBox: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  startBtn: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  startBtnText: { color: '#fff', fontWeight: '600' },
  state: { color: '#6b7280', textAlign: 'center', marginTop: 8 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 24, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  badge: {
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: '#15803d', fontSize: 12, fontWeight: '700' },
  snippet: { marginTop: 4, color: '#4b5563', fontSize: 13 },
  date: { marginTop: 4, color: '#6b7280', fontSize: 12 },
})
