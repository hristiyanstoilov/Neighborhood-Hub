import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 5 requests per 15 minutes per IP — for login
export const loginRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: 'rl:login',
})

// 20 requests per 15 minutes per session key — for refresh
export const refreshRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '15 m'),
  prefix: 'rl:refresh',
})

// 3 requests per hour per IP — for register
export const registerRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'rl:register',
})

// 20 requests per hour per user — for AI chat
export const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  prefix: 'rl:ai',
})

// 100 requests per minute per user — for all other routes
export const apiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  prefix: 'rl:api',
})

// 30 requests per minute per IP — for public search
export const searchPublicRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  prefix: 'rl:search:public',
})

// 60 requests per minute per authenticated user — for search
export const searchUserRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix: 'rl:search:user',
})

// 30 requests per minute per IP — for public feed
export const feedPublicRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  prefix: 'rl:feed:public',
})
