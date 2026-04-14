import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Animated, StyleSheet, Text } from 'react-native'

type Variant = 'success' | 'error'

interface ToastOptions {
  message: string
  variant?: Variant
}

interface ToastContextValue {
  showToast: (opts: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; variant: Variant } | null>(null)
  const translateY = useRef(new Animated.Value(-80)).current
  const opacity = useRef(new Animated.Value(0)).current
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback(
    ({ message, variant = 'success' }: ToastOptions) => {
      if (hideTimer.current) clearTimeout(hideTimer.current)

      setToast({ message, variant })
      translateY.setValue(-80)
      opacity.setValue(0)

      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()

      hideTimer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -80, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setToast(null))
      }, 3000)
    },
    [translateY, opacity],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            toast.variant === 'error' ? styles.error : styles.success,
            { transform: [{ translateY }], opacity },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.text}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  )
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  success: { backgroundColor: '#15803d' },
  error: { backgroundColor: '#dc2626' },
  text: { color: '#fff', fontSize: 14, fontWeight: '600' },
})
