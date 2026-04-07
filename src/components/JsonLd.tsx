export function WebsiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Clean Energy Scoreboard',
    alternateName: 'Is Clean Energy Winning?',
    url: 'https://iscleanenergywinning.com',
    description: 'Real-time scoreboard tracking the global energy transition. See which countries lead in clean energy and find out if we\'re winning.',
    publisher: {
      '@type': 'Organization',
      name: 'Clean Energy Scoreboard',
      url: 'https://iscleanenergywinning.com',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function DatasetJsonLd({
  name,
  description,
  url,
}: {
  name: string
  description: string
  url: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    url,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: {
      '@type': 'Organization',
      name: 'Ember',
      url: 'https://ember-climate.org',
    },
    temporalCoverage: '2000/..',
    spatialCoverage: {
      '@type': 'Place',
      name: 'World',
    },
    isAccessibleForFree: true,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function CountryPageJsonLd({
  countryName,
  cleanShare,
  year,
  slug,
}: {
  countryName: string
  cleanShare: number | null
  year: number | null
  slug: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${countryName} — Clean Energy Score`,
    description: `${countryName}'s clean energy share is ${cleanShare != null ? `${cleanShare.toFixed(1)}%` : 'N/A'}${year ? ` (${year})` : ''}. See the full breakdown and historical trend.`,
    url: `https://iscleanenergywinning.com/country/${slug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Clean Energy Scoreboard',
      url: 'https://iscleanenergywinning.com',
    },
    about: {
      '@type': 'Country',
      name: countryName,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function StatePageJsonLd({
  stateName,
  cleanShare,
  year,
  slug,
}: {
  stateName: string
  cleanShare: number | null
  year: number | null
  slug: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${stateName} — Clean Energy Score`,
    description: `${stateName}'s clean energy share is ${cleanShare != null ? `${cleanShare.toFixed(1)}%` : 'N/A'}${year ? ` (${year})` : ''}. See the full breakdown and historical trend.`,
    url: `https://iscleanenergywinning.com/state/${slug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Clean Energy Scoreboard',
      url: 'https://iscleanenergywinning.com',
    },
    about: {
      '@type': 'AdministrativeArea',
      name: stateName,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
