# Neighborhood Hub — Infrastructure Cost Model

> Last updated: 2026-05-17

## Summary

| Service | Free tier | Cost at 1 000 MAU | Cost at 10 000 MAU |
|---------|-----------|-------------------|---------------------|
| Neon (DB) | 0.5 GB storage, 190 compute hours/mo | **$0** | **~$19/mo** |
| Netlify (hosting) | 125k function calls/mo, 100 GB bandwidth | **$0** | **~$25/mo** |
| Upstash (Redis) | 10 000 commands/day, 256 MB | **$0** | **~$10/mo** |
| Resend (email) | 3 000 emails/mo | **$0** | **~$20/mo** |
| Anthropic (AI) | Pay-per-token, no free tier | **~$2/mo** | **~$20/mo** |
| Cloudflare R2 (files) | 10 GB storage, 1M Class A ops/mo | **$0** | **$0–$5/mo** |
| **Total** | | **~$2/mo** | **~$99/mo** |

---

## Detailed Breakdown

### 1. Neon — PostgreSQL Database

**Free tier (Hobby plan):**
- 0.5 GB storage
- 190 compute hours/month (shared CPU)
- 1 project, 1 branch
- No autosuspend penalty in dev

**Scaling:**
| MAU | Storage est. | Compute | Monthly cost |
|-----|-------------|---------|-------------|
| 1 000 | ~100 MB | ~20h | $0 (free) |
| 10 000 | ~1 GB | ~200h | ~$19 (Launch plan) |
| 100 000 | ~10 GB | >500h | ~$69–$299 (Scale plan) |

**Notes:**
- At 1k MAU: skill requests, messages, notifications stay well under 500 MB
- At 10k MAU: Launch plan ($19/mo) adds 10 GB storage and 300 compute hours
- Biggest growth drivers: `messages`, `feed_events`, `audit_log` — archive these aggressively per data retention policy

---

### 2. Netlify — Next.js Hosting + Serverless Functions

**Free tier (Starter):**
- 125 000 serverless function invocations/month
- 100 GB bandwidth/month
- 300 build minutes/month

**Scaling:**
| MAU | API calls est. | Bandwidth | Monthly cost |
|-----|---------------|-----------|-------------|
| 1 000 | ~50k/mo | ~5 GB | $0 (free) |
| 10 000 | ~500k/mo | ~50 GB | ~$25 (Pro plan) |
| 100 000 | ~5M/mo | ~500 GB | ~$99+ (Business plan) |

**Notes:**
- At 1k MAU: easily within free tier (50k function calls vs 125k limit)
- At 10k MAU: Pro plan ($25/mo) needed — 1M function calls, 400 GB bandwidth
- CI/CD builds: 300 minutes/mo free is ample for a small team (5–10 deploys/week ≈ 50 build-minutes)

---

### 3. Upstash — Redis (Rate Limiting)

**Free tier:**
- 10 000 commands/day (~300k/month)
- 256 MB storage
- 1 database

**Scaling:**
| MAU | Redis commands est. | Monthly cost |
|-----|---------------------|-------------|
| 1 000 | ~30k/mo | $0 (free) |
| 10 000 | ~300k/mo | $0 (free) |
| 100 000 | ~3M/mo | ~$10 (Pay-as-you-go) |

**Notes:**
- Rate limit checks = 1 Redis command per API request
- At 10k MAU: ~10 API calls/user/day × 10k = 100k commands/day — slightly over free tier
- Pay-as-you-go pricing: $0.20 per 100k commands beyond free tier

---

### 4. Resend — Transactional Email

**Free tier:**
- 3 000 emails/month
- 100 emails/day cap

**Scaling:**
| MAU | Emails est. | Monthly cost |
|-----|------------|-------------|
| 1 000 | ~500/mo (registrations + notifications) | $0 (free) |
| 10 000 | ~5 000/mo | ~$20 (Pro plan) |
| 100 000 | ~50 000/mo | ~$90 (Business plan) |

**Notes:**
- Email types: registration verify, password reset, skill request updates, tool reservation updates
- At 1k MAU: well within free tier
- At 10k MAU: Pro plan at $20/mo unlocks 50k emails/month and removes daily cap

---

### 5. Anthropic — AI Chat (claude-haiku-4-5)

**Pricing (claude-haiku-4-5-20251001):**
- Input tokens: $0.80 per 1M tokens
- Output tokens: $4.00 per 1M tokens

**Scaling:**
| MAU | AI sessions est. | Tokens est. | Monthly cost |
|-----|-----------------|------------|-------------|
| 1 000 | ~100 active/mo, 5 msgs each | ~500k tokens | ~$2/mo |
| 10 000 | ~1 000 active/mo | ~5M tokens | ~$20/mo |
| 100 000 | ~10 000 active/mo | ~50M tokens | ~$200/mo |

**Notes:**
- AI chat is rate-limited to 20 requests/hour per user (`aiRatelimit`)
- System prompt: ~300 tokens per session, each user message: ~200 tokens, each response: ~400 tokens
- Current model `claude-haiku-4-5` chosen specifically for cost: 8× cheaper than Sonnet on output tokens

---

### 6. Cloudflare R2 — File Storage (Profile Photos, Uploads)

**Free tier:**
- 10 GB storage/month
- 1 000 000 Class A operations/month (PUT/POST)
- 10 000 000 Class B operations/month (GET/HEAD)
- **Zero egress fees** (key advantage over S3)

**Scaling:**
| MAU | Storage est. | Cost |
|-----|-------------|------|
| 1 000 | ~200 MB (avg 200 KB/user) | $0 |
| 10 000 | ~2 GB | $0 |
| 100 000 | ~20 GB | ~$5/mo (storage: $0.015/GB-month beyond 10 GB) |

**Notes:**
- Profile photos: resized to 400×400 before upload (target <100 KB each)
- No egress cost — R2 serves directly to users without transfer charges
- At 100k MAU: still nearly free ($5/mo storage + negligible operations cost)

---

## Pre-Launch Checklist

Before any partner conversation or App Store submission, confirm:

- [ ] Neon production branch isolated from dev branch
- [ ] Netlify environment variables separated (`.env.production` vs `.env.preview`)
- [ ] Upstash database has a separate production instance
- [ ] Resend domain verified (SPF/DKIM) on `neighborhoodhub.bg`
- [ ] Cloudflare R2 CORS policy allows only `neighborhoodhub.bg` origin
- [ ] All 6 services have billing alerts configured

## Cost Risk Factors

| Risk | Mitigation |
|------|-----------|
| AI chat abuse (scraping quota) | `aiRatelimit` 20/hr per verified user + `requireVerifiedAuth` |
| File upload abuse (storage explosion) | 5 MB cap + MIME allowlist in `/api/upload` |
| Audit log / feed_events growth | Monthly data-retention job (`POST /api/admin/data-retention`) |
| Search abuse (Neon CPU spikes) | `searchPublicRatelimit` 30/min per IP |
