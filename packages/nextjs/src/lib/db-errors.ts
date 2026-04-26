export function isUniqueViolation(err: unknown, indexHint?: string): boolean {
  const visited = new Set<unknown>()
  const queue: unknown[] = [err]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || visited.has(current)) continue
    visited.add(current)

    if (typeof current === 'object') {
      const obj = current as { code?: unknown; message?: unknown; cause?: unknown }
      if (typeof obj.code === 'string' && obj.code === '23505') return true

      const message = typeof obj.message === 'string' ? obj.message.toLowerCase() : ''
      if (message.includes('duplicate key value')) return true
      if (indexHint && message.includes(indexHint.toLowerCase())) return true

      if ('cause' in obj) queue.push(obj.cause)
    }

    if (current instanceof Error && current.cause) {
      queue.push(current.cause)
    }
  }

  return false
}
