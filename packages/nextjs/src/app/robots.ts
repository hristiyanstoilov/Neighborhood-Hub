import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: [
          '/api/',
          '/profile/',
          '/my-requests/',
          '/my-reservations/',
          '/my-events/',
          '/my-drives/',
          '/food/reservations/',
          '/messages/',
          '/admin/',
        ],
      },
    ],
    sitemap: 'https://neighborhoodhub.net/sitemap.xml',
  }
}
