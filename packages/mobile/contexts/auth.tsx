import React, { createContext, useContext, useEffect, useState } from 'react'
import { Storage } from '../lib/storage'
import { apiFetch, refreshAccessToken, setAccessToken } from '../lib/api'

interface UserProfile {
  name: string | null
  avatarUrl: string | null
  bio: string | null
}

interface AuthUser {
  id: string
  email: string
  role: string
  emailVerifiedAt: string | null
  profile: UserProfile | null
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    async function restore() {
      try {
        const newToken = await refreshAccessToken()
        if (!newToken) return

        const res = await apiFetch('/api/auth/me')
        if (!res.ok) return

        const json = await res.json()
        setUser(json.data ?? null)
      } catch (err) {
        console.error('[auth] restore failed:', err)
      } finally {
        setLoading(false)
      }
    }
    restore()
  }, [])

  async function login(email: string, password: string): Promise<{ error?: string }> {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    const json = await res.json()

    if (!res.ok) {
      return { error: json.error ?? 'LOGIN_FAILED' }
    }

    const { accessToken, refreshToken, user: userData } = json.data
    setAccessToken(accessToken)
    if (refreshToken) await Storage.set('refresh_token', refreshToken)
    setUser(userData)

    return {}
  }

  async function register(name: string, email: string, password: string): Promise<{ error?: string }> {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })

    const json = await res.json()

    if (!res.ok) {
      return { error: json.error ?? 'REGISTER_FAILED' }
    }

    return {}
  }

  async function logout(): Promise<void> {
    try {
      const refreshToken = await Storage.get('refresh_token')
      await apiFetch('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      })
    } catch {
      // best-effort — local state is cleared regardless
    }
    setAccessToken(null)
    await Storage.delete('refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
