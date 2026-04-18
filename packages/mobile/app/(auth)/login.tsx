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
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useAuth } from '../../contexts/auth'

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_LOCKED: 'Account is temporarily locked. Try again later.',
  TOO_MANY_REQUESTS: 'Too many attempts. Please wait and try again.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
}

export default function LoginScreen() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please fill in all fields.')
      return
    }
    setError(null)
    setLoading(true)

    const result = await login(email.trim().toLowerCase(), password)

    setLoading(false)
    if (result.error) {
      setError(ERROR_MESSAGES[result.error] ?? 'Login failed. Please try again.')
    }
    // Navigation is handled automatically by RootNavigation in _layout.tsx
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Neighborhood Hub</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

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
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          editable={!loading}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Sign in</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotRow}
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>Don't have an account? <Text style={styles.link}>Register</Text></Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    paddingHorizontal: 24,
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
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
    marginTop: 12,
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
  forgotRow: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  forgotText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '500',
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
