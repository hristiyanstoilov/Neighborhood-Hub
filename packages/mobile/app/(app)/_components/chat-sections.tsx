import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import type { RefObject } from 'react'
import type { ChatConversation, ChatMessage } from '../../../lib/queries/ai-conversations'

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

export function ChatLoggedOutState(props: { onLogin: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.centerIcon}>🤖</Text>
      <Text style={styles.centerTitle}>AI Neighborhood Assistant</Text>
      <Text style={styles.centerSubtitle}>Log in to chat with your neighborhood AI.</Text>
      <TouchableOpacity style={styles.loginBtn} onPress={props.onLogin}>
        <Text style={styles.loginBtnText}>Log in</Text>
      </TouchableOpacity>
    </View>
  )
}

function ChatInputBar(props: {
  inputRef: RefObject<TextInput | null>
  input: string
  onChangeInput: (value: string) => void
  onSend: () => void
  sending: boolean
}) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.inputBar}>
        <TextInput
          ref={props.inputRef}
          style={styles.input}
          value={props.input}
          onChangeText={props.onChangeInput}
          placeholder="Ask something…"
          multiline
          maxLength={2000}
          editable={!props.sending}
          returnKeyType="send"
          onSubmitEditing={props.onSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!props.input.trim() || props.sending) && styles.sendBtnDisabled]}
          onPress={props.onSend}
          disabled={!props.input.trim() || props.sending}
        >
          <Text style={styles.sendBtnText}>{props.sending ? '…' : '↑'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

export function ChatConversationListSection(props: {
  conversations: ChatConversation[]
  loadingConvs: boolean
  sending: boolean
  input: string
  inputRef: RefObject<TextInput | null>
  onChangeInput: (value: string) => void
  onSend: () => void
  onStartNew: () => void
  onOpenConversation: (conversation: ChatConversation) => void
  onDeleteConversation: (id: string) => void
  onSuggestion: (text: string) => void
}) {
  return (
    <View style={styles.container}>
      <View style={styles.listHeader}>
        <Text style={styles.headerTitle}>AI Chat</Text>
        <TouchableOpacity style={styles.newBtn} onPress={props.onStartNew}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {props.loadingConvs ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#15803d" />
        </View>
      ) : props.conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.centerIcon}>💬</Text>
          <Text style={styles.centerTitle}>Ask me anything</Text>
          <Text style={styles.centerSubtitle}>About skills, requests, or your neighborhood.</Text>
          <View style={styles.chipsGrid}>
            {SUGGESTION_CHIPS.map((chip) => (
              <TouchableOpacity key={chip} style={styles.chipBtn} onPress={() => props.onSuggestion(chip)} disabled={props.sending}>
                <Text style={styles.chipBtnText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={props.conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.convList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.convItem}
              onPress={() => props.onOpenConversation(item)}
              onLongPress={() => props.onDeleteConversation(item.id)}
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

      <ChatInputBar
        inputRef={props.inputRef}
        input={props.input}
        onChangeInput={props.onChangeInput}
        onSend={props.onSend}
        sending={props.sending}
      />
    </View>
  )
}

export function ChatActiveConversationSection(props: {
  title: string
  loadingMsgs: boolean
  messages: ChatMessage[]
  messagesError: string | null
  sending: boolean
  input: string
  inputRef: RefObject<TextInput | null>
  flatListRef: RefObject<FlatList | null>
  onChangeInput: (value: string) => void
  onSend: () => void
  onBack: () => void
}) {
  return (
    <View style={styles.container}>
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={props.onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.chatHeaderTitle} numberOfLines={1}>{props.title || 'Conversation'}</Text>
      </View>

      {props.loadingMsgs ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#15803d" />
        </View>
      ) : (
        <>
          {props.messagesError && (
            <View style={styles.messageErrorWrap}>
              <Text style={styles.errorText}>{props.messagesError}</Text>
            </View>
          )}
          <FlatList
            ref={props.flatListRef}
            data={props.messages}
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

      <ChatInputBar
        inputRef={props.inputRef}
        input={props.input}
        onChangeInput={props.onChangeInput}
        onSend={props.onSend}
        sending={props.sending}
      />
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