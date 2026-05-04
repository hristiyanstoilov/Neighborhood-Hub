import type { NextConfig } from 'next'
import path from 'path'
import { withSentryConfig } from '@sentry/nextjs'

const isDevelopment = process.env.NODE_ENV !== 'production'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // next-intl@3.x requires 'next-intl/config' to resolve to the request config at build time.
  // createNextIntlPlugin does this via webpack, which does not work under Turbopack (Next 16 default).
  // Setting it manually in turbopack.resolveAlias covers the Turbopack build path.
  turbopack: {
    resolveAlias: {
      'next-intl/config': './src/i18n/request.ts',
    },
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            // 'unsafe-inline' required by Next.js for hydration scripts
            `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self'",
            "connect-src 'self' https://eu.i.posthog.com https://us.i.posthog.com https://*.ingest.sentry.io",
            "frame-ancestors 'none'",
          ].join('; '),
        },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      ],
    },
  ],
}

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  widenClientFileUpload: true,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  // Source map upload requires SENTRY_AUTH_TOKEN env var — skipped if absent
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
})
