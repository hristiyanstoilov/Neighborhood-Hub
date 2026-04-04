'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { apiFetch, setAccessToken } from '@/lib/api'

interface User {
  id: string
  email: string
  role: 'user' | 'admin'
  emailVerifiedAt: string | null
  profile: {
    name: string | null
    bio: string | null
    avatarUrl: string | null
    isPublic: boolean
    locationId: string | null
  } | null
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (accessToken: string, user: User) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const res = await apiFetch('/api/auth/me')
    if (res.ok) {
      const json = await res.json()
      setUser(json.data)
    } else {
      setUser(null)
      setAccessToken(null)
    }
  }, [])

  // On mount, try to restore session via refresh token cookie
  useEffect(() => {
    async function restore() {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        const json = await res.json()
        setAccessToken(json.data.accessToken)
        await refreshUser()
      }
      setLoading(false)
    }
    restore()
  }, [refreshUser])

  const login = useCallback((accessToken: string, userData: User) => {
    setAccessToken(accessToken)
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    setAccessToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
