'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from './api'
import { queryKeys } from './query-keys'

export function useNotificationStream(userId: string | undefined) {
  const queryClient = useQueryClient()
  const lastIdRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!userId) return
    const resolvedUserId: string = userId

    let retryDelay = 2000
    let stopped = false

    async function connect() {
      if (stopped) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const token = getAccessToken()
      if (!token) return

      const url = lastIdRef.current
        ? `/api/notifications/stream?lastId=${encodeURIComponent(lastIdRef.current)}`
        : '/api/notifications/stream'

      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          throw new Error('bad response')
        }

        retryDelay = 2000
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          let eventType = 'message'
          let dataLine = ''
          let idLine = ''

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim()
            } else if (line.startsWith('data:')) {
              dataLine = line.slice(5).trim()
            } else if (line.startsWith('id:')) {
              idLine = line.slice(3).trim()
            } else if (line === '') {
              if (idLine) lastIdRef.current = idLine

              if (eventType === 'notification') {
                // Invalidate so bell count and notifications page refresh
                void queryClient.invalidateQueries({
                  queryKey: queryKeys.notifications.unread(resolvedUserId),
                })
              } else if (eventType === 'reconnect') {
                controller.abort()
              }

              void dataLine // suppress unused-var lint

              eventType = 'message'
              dataLine = ''
              idLine = ''
            }
          }
        }
      } catch (err: unknown) {
        const isAbort = err instanceof Error && err.name === 'AbortError'
        if (stopped || isAbort) return
      }

      if (!stopped) {
        setTimeout(() => void connect(), Math.min(retryDelay, 30_000))
        retryDelay = Math.min(retryDelay * 2, 30_000)
      }
    }

    void connect()

    return () => {
      stopped = true
      abortRef.current?.abort()
    }
  }, [userId, queryClient])
}
