# Deployment Guide — Neighborhood Hub

Last updated: April 2026

---

## Platform

- **Web:** Netlify (Next.js serverless via `@netlify/plugin-nextjs`)
- **Database:** Neon PostgreSQL (serverless, auto-suspend)
- **Storage:** Cloudflare R2 (avatar/image uploads)

---

## Pre-deploy Checklist

### 1. Run database migrations

Always run migrations before deploying a new build:

```bash
cd packages/nextjs
npx drizzle-kit migrate
```

Drizzle applies pending migration files from `src/db/migrations/` against `DATABASE_URL`.

### 2. Verify environment variables in Netlify dashboard

Go to **Site settings → Environment variables** and confirm all of the following are set:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon connection string (pooled) |
| `JWT_SECRET` | ✅ | Secret for signing access + refresh tokens (min 32 chars) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL of the deployed site (e.g. `https://your-app.netlify.app`) |
| `RESEND_API_KEY` | ✅ | Resend API key for transactional email |
| `RESEND_FROM` | ✅ | Sender address (e.g. `noreply@yourdomain.com`) |
| `ANTHROPIC_API_KEY` | ✅ | Anthropic API key for AI chat |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis token |
| `CLOUDFLARE_R2_BUCKET` | ✅ | R2 bucket name |
| `CLOUDFLARE_R2_ACCOUNT_ID` | ✅ | Cloudflare account ID |
| `CLOUDFLARE_R2_ACCESS_KEY` | ✅ | R2 access key |
| `CLOUDFLARE_R2_SECRET_KEY` | ✅ | R2 secret key |
| `CLOUDFLARE_R2_PUBLIC_URL` | ✅ | Public base URL for R2 objects (e.g. `https://pub-xxx.r2.dev`) |

### 3. Build command

The `netlify.toml` already configures this:

```toml
[build]
  base    = "packages/nextjs"
  command = "rm -rf .next src/app/admin ../../package-lock.json && npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

> Note: the strip command targets `src/app/admin` but admin lives at `src/app/(web)/admin` (route group). Admin routes **do deploy** to production — they are protected by `requireAdmin` middleware, which is sufficient for this project.

---

## Deploy flow

```
git push origin master
→ Netlify auto-deploys from master
→ Build: npm install + npm run build
→ @netlify/plugin-nextjs adapts routes to serverless functions
→ Site goes live
```

---

## Rollback

Netlify keeps a full deploy history. To roll back:
1. Go to **Deploys** tab in Netlify dashboard
2. Click any prior deploy → **Publish deploy**

---

## Post-deploy smoke test

After deploying, run the smoke scripts against the production URL:

```bash
SMOKE_BASE_URL=https://your-app.netlify.app \
SMOKE_AUTH_EMAIL=your@email.com \
SMOKE_AUTH_PASSWORD=yourpassword \
node scripts/smoke-auth.mjs
```

---

## Notes

- Neon auto-suspends after inactivity — first request after cold start may be slow (~1–2 s).
- R2 CORS must allow `NEXT_PUBLIC_APP_URL` for image uploads to work.
- Rate limiting uses Upstash Redis — ensure the Upstash database region is close to Netlify's deployment region (e.g. `eu-west-2`).
- Mobile app (Expo) is separate — use `eas build` + `eas submit` from `packages/mobile` for production mobile builds.
