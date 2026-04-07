import type { MetadataRoute } from 'next'
import { getAllCountrySlugs, getAllStateSlugs } from '@/lib/supabase/queries'

const BASE_URL = 'https://iscleanenergywinning.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [countrySlugs, stateSlugs] = await Promise.all([
    getAllCountrySlugs().catch(() => []),
    getAllStateSlugs().catch(() => []),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/states`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/race`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/compare`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/share`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/embed`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const countryPages: MetadataRoute.Sitemap = countrySlugs.map((s: { slug: string }) => ({
    url: `${BASE_URL}/country/${s.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const statePages: MetadataRoute.Sitemap = stateSlugs.map((s: { slug: string }) => ({
    url: `${BASE_URL}/state/${s.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...countryPages, ...statePages]
}
