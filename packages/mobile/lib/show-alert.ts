import { Alert, Platform } from 'react-native'

type AlertButton = {
  text: string
  onPress?: () => void | Promise<void>
  style?: 'default' | 'cancel' | 'destructive'
}

export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons as any)
    return
  }

  const msg = [title, message].filter(Boolean).join('\n\n')

  if (!buttons || buttons.length <= 1) {
    window.alert(msg)
    buttons?.[0]?.onPress?.()
    return
  }

  const cancelBtn = buttons.find((b) => b.style === 'cancel')
  const actionBtn = buttons.find((b) => b.style !== 'cancel')

  if (window.confirm(msg)) {
    actionBtn?.onPress?.()
  } else {
    cancelBtn?.onPress?.()
  }
}
