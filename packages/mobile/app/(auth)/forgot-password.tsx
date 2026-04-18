import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { apiFetch } from '../../lib/api'

const ERROR_MESSAGES: Record<string, string> = {
  TOO_MANY_REQUESTS: 'Too many attempts. Please wait and try again.',
  NETWORK_ERROR:     'Network error. Please check your connection.',
}

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError('Please enter your email address.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: trimmed }),
      })

      if (res.status === 429) {
        setError(ERROR_MESSAGES.TOO_MANY_REQUESTS)
        return
      }

      if (res.status === 0) {
        setError(ERROR_MESSAGES.NETWORK_ERROR)
        return
      }

      // Always show success — never reveal whether the email exists
      setSubmitted(true)
    } catch {
      setError(ERROR_MESSAGES.NETWORK_ERROR)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {submitted ? (
            // ── Success state ──────────────────────────────────────────────
            <>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>
                If an account with that email exists, we sent a reset link.
                It expires in 1 hour.
              </Text>
              <Text style={styles.instructions}>
                Tap the link in the email to set a new password, then come back
                here to sign in.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => router.back()}
              >
                <Text style={styles.buttonText}>Back to login</Text>
              </TouchableOpacity>
            </>
          ) : (
            // ── Form state ─────────────────────────────────────────────────
            <>
              <Text style={styles.title}>Forgot your password?</Text>
              <Text style={styles.subtitle}>
                Enter your email and we'll send you a reset link.
              </Text>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Send reset link</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => router.back()}
              >
                <Text style={styles.linkText}>
                  Remembered it?{' '}
                  <Text style={styles.link}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  instructions: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#15803d',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#86efac',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  linkRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#6b7280',
    fontSize: 13,
  },
  link: {
    color: '#15803d',
    fontWeight: '500',
  },
})
