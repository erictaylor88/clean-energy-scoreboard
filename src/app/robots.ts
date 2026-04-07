import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/sync', '/api/test-keys'],
      },
    ],
    sitemap: 'https://iscleanenergywinning.com/sitemap.xml',
  }
}
