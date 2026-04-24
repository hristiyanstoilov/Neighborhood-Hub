import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth'
import { useToast } from '../../../lib/toast'
import {
  createConversation,
  dmKeys,
  fetchConversations,
  searchUsers,
  type ConversationItem,
  type UserSearchResult,
} from '../../../lib/queries/direct-messages'
import { formatDateTime } from '../../../lib/format'

export default function MessagesListScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<UserSearchResult | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchSeqRef = useRef(0)

  const listQuery = useQuery({
    queryKey: dmKeys.conversations(user?.id ?? 'guest'),
    queryFn: fetchConversations,
    enabled: Boolean(user),
    refetchInterval: 15_000,
  })

  const startMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: ({ conversationId }) => {
      setSelected(null)
      setQuery('')
      setSearchResults([])
      router.push(`/(app)/messages/${conversationId}`)
    },
    onError: (error) => {
      const code = error instanceof Error ? error.message : 'FAILED_TO_START_CONVERSATION'
      showToast({
        variant: 'error',
        message: code === 'CONVERSATION_NOT_ALLOWED' ? 'You cannot start a conversation with this user.' : 'Could not start conversation.',
      })
    },
  })

  useEffect(() => {
    if (selected) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      return
    }

    const trimmed = query.trim()

    if (trimmed.length < 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setSearchResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const requestId = ++searchSeqRef.current

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchUsers(trimmed)
        if (searchSeqRef.current === requestId) {
          setSearchResults(results)
        }
      } catch {
        if (searchSeqRef.current === requestId) {
          setSearchResults([])
        }
      } finally {
        if (searchSeqRef.current === requestId) {
          setSearching(false)
        }
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, selected])

  function handleSelectUser(u: UserSearchResult) {
    setSelected(u)
    setSearchResults([])
  }

  function handleClearSelection() {
    setSelected(null)
    setQuery('')
    setSearchResults([])
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>

      {/* User search / start conversation */}
      <View style={styles.searchBox}>
        {selected ? (
          <View style={styles.selectedRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(selected.name ?? '?')[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.selectedName} numberOfLines={1}>{selected.name ?? 'Unknown'}</Text>
            <Pressable onPress={handleClearSelection} style={styles.changeBtn}>
              <Text style={styles.changeBtnText}>Change</Text>
            </Pressable>
            <Pressable
              style={[styles.startBtn, startMutation.isPending && styles.btnDisabled]}
              onPress={() => startMutation.mutate(selected.id)}
              disabled={startMutation.isPending}
            >
              <Text style={styles.startBtnText}>{startMutation.isPending ? '…' : 'Start'}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.inputRow}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name or email…"
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searching && <ActivityIndicator size="small" color="#15803d" style={styles.spinner} />}
            </View>
            {searchResults.length > 0 && (
              <View style={styles.dropdown}>
                {searchResults.map((u) => (
                  <Pressable key={u.id} style={styles.dropdownItem} onPress={() => handleSelectUser(u)}>
                    <View style={styles.avatarSm}>
                      <Text style={styles.avatarSmText}>{(u.name ?? '?')[0].toUpperCase()}</Text>
                    </View>
                    <Text style={styles.dropdownName}>{u.name ?? 'Unknown'}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {!searching && query.length >= 2 && searchResults.length === 0 && (
              <Text style={styles.noResults}>No users found.</Text>
            )}
          </>
        )}
      </View>

      {listQuery.isLoading ? <Text style={styles.state}>Loading conversations...</Text> : null}
      {listQuery.isError ? <Text style={styles.state}>Could not load conversations.</Text> : null}

      <FlatList
        data={listQuery.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={(listQuery.data?.length ?? 0) === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={!listQuery.isLoading ? <Text style={styles.state}>No conversations yet.</Text> : null}
        renderItem={({ item }: { item: ConversationItem }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/(app)/messages/${item.id}`)}>
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

  searchBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 4,
    color: '#111827',
  },
  spinner: { marginLeft: 8 },
  dropdown: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  avatarSm: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmText: { color: '#15803d', fontWeight: '700', fontSize: 13 },
  dropdownName: { fontSize: 14, color: '#111827' },
  noResults: { marginTop: 6, fontSize: 12, color: '#6b7280', paddingHorizontal: 4 },

  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  selectedName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  changeBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  changeBtnText: { fontSize: 13, color: '#6b7280' },
  startBtn: {
    backgroundColor: '#15803d',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnDisabled: { opacity: 0.6 },
  startBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

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
  badge: { backgroundColor: '#dcfce7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#15803d', fontSize: 12, fontWeight: '700' },
  snippet: { marginTop: 4, color: '#4b5563', fontSize: 13 },
  date: { marginTop: 4, color: '#6b7280', fontSize: 12 },
})
