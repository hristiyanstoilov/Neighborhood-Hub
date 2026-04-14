import { useRouter } from 'expo-router'
import { useAuth } from '../../contexts/auth'
import { useChatScreenState } from './_hooks/use-chat-screen-state'
import {
  ChatActiveConversationSection,
  ChatConversationListSection,
  ChatLoggedOutState,
} from './_components/chat-sections'

export default function ChatScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const state = useChatScreenState({ userId: user?.id })

  if (!user) {
    return <ChatLoggedOutState onLogin={() => router.push('/(auth)/login')} />
  }

  if (state.activeConvId === null) {
    return (
      <ChatConversationListSection
        conversations={state.conversations}
        loadingConvs={state.loadingConvs}
        sending={state.sending}
        input={state.input}
        inputRef={state.inputRef}
        onChangeInput={state.setInput}
        onSend={state.handleSend}
        onStartNew={state.startNewConversation}
        onOpenConversation={state.openConversation}
        onDeleteConversation={state.requestDeleteConversation}
        onSuggestion={(text) => void state.sendText(text)}
      />
    )
  }

  return (
    <ChatActiveConversationSection
      title={state.activeConvTitle}
      loadingMsgs={state.loadingMsgs}
      messages={state.messages}
      messagesError={state.messagesError}
      sending={state.sending}
      input={state.input}
      inputRef={state.inputRef}
      flatListRef={state.flatListRef}
      onChangeInput={state.setInput}
      onSend={state.handleSend}
      onBack={state.closeConversation}
    />
  )
}