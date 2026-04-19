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
| `JWT_SECRET` | ✅ | Secret for signing access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Secret for signing refresh tokens (min 32 chars) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL of the deployed site (e.g. `https://your-app.netlify.app`) |
| `CLOUDFLARE_R2_ACCOUNT_ID` | ✅ | Cloudflare account ID |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | ✅ | R2 access key ID |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | ✅ | R2 secret key |
| `CLOUDFLARE_R2_BUCKET_NAME` | ✅ | R2 bucket name |
| `CLOUDFLARE_R2_PUBLIC_URL` | ✅ | Public base URL for R2 objects |
| `RESEND_API_KEY` | ✅ | Resend API key for transactional email |
| `RESEND_FROM_EMAIL` | ✅ | Sender address (e.g. `noreply@yourdomain.com`) |
| `OPENAI_API_KEY` | ✅ | OpenAI key for AI chat/recommendations |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis token |

### 3. Build command

The `netlify.toml` already configures this:

```
base    = "packages/nextjs"
command = rm -rf .next src/app/admin ../../package-lock.json && npm run build
publish = .next
```

The `rm -rf src/app/admin` strip strips the admin routes from the production bundle (no admin UI in production).

---

## Deploy flow

```
git push origin master
→ Netlify auto-deploys from master
→ Build runs: npm install + npm run build
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
node scripts/smoke-web.mjs
```

---

## Notes

- Neon auto-suspends after inactivity — first request after cold start may be slow (~1-2s).
- R2 CORS must allow `NEXT_PUBLIC_APP_URL` for image uploads to work.
- Rate limiting uses Upstash Redis — ensure the Upstash database region is close to Netlify's deployment region (eu-west-2).
