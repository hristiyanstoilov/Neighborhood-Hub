import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useAuth } from '../../contexts/auth'
import { apiFetch } from '../../lib/api'

interface Message {
  id?: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
  createdAt?: string
}

interface Conversation {
  id: string
  title: string | null
  updatedAt: string
}

const SUGGESTION_CHIPS = [
  'What skills are available near me?',
  'How do I request a skill?',
  'How do I offer my own skill?',
  'What happens after I send a request?',
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function ChatScreen() {
  const { user } = useAuth()
  const router = useRouter()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [activeConvTitle, setActiveConvTitle] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [messagesError, setMessagesError] = useState<string | null>(null)

  const flatListRef = useRef<FlatList>(null)
  const inputRef = useRef<TextInput>(null)

  const loadConversations = useCallback(async () => {
    setLoadingConvs(true)
    try {
      const res = await apiFetch('/api/ai/conversations')
      if (res.ok) {
        const json = await res.json()
        setConversations(json.data ?? [])
      }
    } finally {
      setLoadingConvs(false)
    }
  }, [])

  useFocusEffect(useCallback(() => {
    if (user) {
      loadConversations()
    } else {
      setConversations([])
      setActiveConvId(null)
      setMessages([])
      setLoadingConvs(false)
    }
  }, [user, loadConversations]))

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80)
    }
  }, [messages])

  async function openConversation(conv: Conversation) {
    setActiveConvId(conv.id)
    setActiveConvTitle(conv.title ?? 'Conversation')
    setMessages([])
    setMessagesError(null)
    setLoadingMsgs(true)
    try {
      const res = await apiFetch(`/api/ai/conversations/${conv.id}`)
      if (res.ok) {
        const json = await res.json()
        setMessages(json.data.messages ?? [])
      } else {
        setMessagesError('Could not load messages for this conversation.')
      }
    } catch {
      setMessagesError('Could not load messages for this conversation.')
    } finally {
      setLoadingMsgs(false)
    }
  }

  function startNewConversation() {
    setActiveConvId(null)
    setActiveConvTitle('')
    setMessages([])
    setMessagesError(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function deleteConversation(id: string) {
    Alert.alert('Delete conversation', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await apiFetch(`/api/ai/conversations/${id}`, { method: 'DELETE' }).catch(() => {})
          setConversations((prev) => prev.filter((c) => c.id !== id))
          if (activeConvId === id) {
            setActiveConvId(null)
            setMessages([])
          }
        },
      },
    ])
  }

  async function sendText(text: string) {
    if (!text || sending) return
    setSending(true)

    const optimisticId = `opt-${Date.now()}`
    const placeholderId = `ph-${Date.now()}`

    setMessages((prev) => [
      ...prev,
      { id: optimisticId, role: 'user', content: text },
      { id: placeholderId, role: 'assistant', content: '', pending: true },
    ])

    try {
      const res = await apiFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, ...(activeConvId ? { conversationId: activeConvId } : {}) }),
      })
      const json = await res.json()

      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId && m.id !== placeholderId))
        const msgs: Record<string, string> = {
          TOO_MANY_REQUESTS: 'Hourly limit reached (20 messages). Try again later.',
          AI_UNAVAILABLE: 'AI is temporarily unavailable.',
          CONVERSATION_NOT_FOUND: 'Conversation not found.',
        }
        Alert.alert('Error', msgs[json.error] ?? 'Something went wrong.')
        return
      }

      const { conversationId, message: assistantMsg } = json.data

      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? { id: assistantMsg.id, role: 'assistant', content: assistantMsg.content, createdAt: assistantMsg.createdAt }
            : m
        )
      )

      if (!activeConvId) {
        setActiveConvId(conversationId)
        const convRes = await apiFetch('/api/ai/conversations')
        if (convRes.ok) {
          const convJson = await convRes.json()
          const convs: Conversation[] = convJson.data ?? []
          setConversations(convs)
          const thisConv = convs.find((c) => c.id === conversationId)
          setActiveConvTitle(thisConv?.title ?? 'New conversation')
        }
      } else {
        setConversations((prev) =>
          prev
            .map((c) => (c.id === conversationId ? { ...c, updatedAt: new Date().toISOString() } : c))
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        )
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId && m.id !== placeholderId))
      Alert.alert('Error', 'Network error. Please check your connection.')
    } finally {
      setSending(false)
    }
  }

  function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    sendText(text)
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerIcon}>🤖</Text>
        <Text style={styles.centerTitle}>AI Neighborhood Assistant</Text>
        <Text style={styles.centerSubtitle}>Log in to chat with your neighborhood AI.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginBtnText}>Log in</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── Conversation list ──────────────────────────────────────────────────────
  if (activeConvId === null) {
    return (
      <View style={styles.container}>
        <View style={styles.listHeader}>
          <Text style={styles.headerTitle}>AI Chat</Text>
          <TouchableOpacity style={styles.newBtn} onPress={startNewConversation}>
            <Text style={styles.newBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {loadingConvs ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#15803d" />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.centerIcon}>💬</Text>
            <Text style={styles.centerTitle}>Ask me anything</Text>
            <Text style={styles.centerSubtitle}>About skills, requests, or your neighborhood.</Text>
            <View style={styles.chipsGrid}>
              {SUGGESTION_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={styles.chipBtn}
                  onPress={() => sendText(chip)}
                  disabled={sending}
                >
                  <Text style={styles.chipBtnText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.convList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.convItem}
                onPress={() => openConversation(item)}
                onLongPress={() => deleteConversation(item.id)}
              >
                <View style={styles.convItemBody}>
                  <Text style={styles.convTitle} numberOfLines={2}>{item.title ?? 'Untitled'}</Text>
                  <Text style={styles.convDate}>{formatDate(item.updatedAt)}</Text>
                </View>
                <Text style={styles.convChevron}>›</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {/* Input for new conversation */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
          <View style={styles.inputBar}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask something…"
              multiline
              maxLength={2000}
              editable={!sending}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || sending}
            >
              <Text style={styles.sendBtnText}>{sending ? '…' : '↑'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    )
  }

  // ── Active conversation ────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => { setActiveConvId(null); setMessages([]) }} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.chatHeaderTitle} numberOfLines={1}>{activeConvTitle || 'Conversation'}</Text>
      </View>

      {/* Messages */}
      {loadingMsgs ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#15803d" />
        </View>
      ) : (
        <>
          {messagesError && (
            <View style={styles.messageErrorWrap}>
              <Text style={styles.errorText}>{messagesError}</Text>
            </View>
          )}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, i) => item.id ?? String(i)}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.centerSubtitle}>No messages yet. Send one below.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
                <Text style={[styles.bubbleText, item.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant, item.pending && styles.bubblePending]}>
                  {item.pending ? '…' : item.content}
                </Text>
              </View>
            )}
          />
        </>
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask something…"
            multiline
            maxLength={2000}
            editable={!sending}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            <Text style={styles.sendBtnText}>{sending ? '…' : '↑'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 8 },
  centerIcon: { fontSize: 40 },
  centerTitle: { fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center' },
  centerSubtitle: { fontSize: 13, color: '#9ca3af', textAlign: 'center', maxWidth: 280 },
  loginBtn: { backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28, marginTop: 8 },
  loginBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Conversation list
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  newBtn: { backgroundColor: '#15803d', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },
  newBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  convList: { paddingBottom: 8 },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  convItemBody: { flex: 1 },
  convTitle: { fontSize: 14, fontWeight: '500', color: '#111827', lineHeight: 20 },
  convDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  convChevron: { fontSize: 20, color: '#d1d5db' },
  separator: { height: 1, backgroundColor: '#f3f4f6' },

  // Active chat
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 4,
  },
  backBtn: { padding: 8 },
  backBtnText: { fontSize: 24, color: '#15803d', lineHeight: 26 },
  chatHeaderTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  messageList: { padding: 16, gap: 10, flexGrow: 1 },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: '#15803d', borderBottomRightRadius: 4 },
  bubbleAssistant: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextAssistant: { color: '#111827' },
  bubblePending: { opacity: 0.5 },
  messageErrorWrap: {
    backgroundColor: '#fef2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: { color: '#991b1b', fontSize: 12, fontWeight: '500' },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#15803d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 20 },

  // Empty state + chips
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 8 },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  chipBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '47%',
  },
  chipBtnText: { fontSize: 13, color: '#15803d', fontWeight: '500', textAlign: 'center' },
})