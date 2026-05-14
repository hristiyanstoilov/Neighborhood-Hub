import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Set DISABLE_RATELIMIT=true in .env.local to bypass Upstash during E2E runs.
const noopRatelimit = {
  async limit() {
    return { success: true }
  },
}

const redis =
  process.env.DISABLE_RATELIMIT === 'true'
    ? null
    : new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })

function makeRatelimit(
  prefix: string,
  requests: number,
  duration: Parameters<typeof Ratelimit.slidingWindow>[1],
) {
  return redis === null
    ? noopRatelimit
    : new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, duration),
        prefix,
      })
}

// 5 requests per 15 minutes per IP — for login
export const loginRatelimit = makeRatelimit('rl:login', 5, '15 m')

// 20 requests per 15 minutes per session key — for refresh
export const refreshRatelimit = makeRatelimit('rl:refresh', 20, '15 m')

// 3 requests per hour per IP — for register
export const registerRatelimit = makeRatelimit('rl:register', 3, '1 h')

// 20 requests per hour per user — for AI chat
export const aiRatelimit = makeRatelimit('rl:ai', 20, '1 h')

// 100 requests per minute per user — for all other routes
export const apiRatelimit = makeRatelimit('rl:api', 100, '1 m')

// 30 requests per minute per IP — for public search
export const searchPublicRatelimit = makeRatelimit('rl:search:public', 30, '1 m')

// 60 requests per minute per authenticated user — for search
export const searchUserRatelimit = makeRatelimit('rl:search:user', 60, '1 m')

// 30 requests per minute per IP — for public feed
export const feedPublicRatelimit = makeRatelimit('rl:feed:public', 30, '1 m')

// 10 creations per hour per user — anti-spam for content creation endpoints
export const createRatelimit = makeRatelimit('rl:create', 10, '1 h')
