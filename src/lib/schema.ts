// Структурированные данные Schema.org (JSON-LD) — помогают Google показать
// в выдаче телефон, район работы, услуги, вопросы-ответы и «хлебные крошки».
import { settings, getReviews, type Service } from './data';
import { homePath, type Lang } from './i18n';

const abs = (path: string) => new URL(path, settings.siteUrl).href;
export const BUSINESS_ID = () => abs('/#business');

export function businessSchema(lang: Lang, services: Service[]) {
  const reviews = getReviews();
  const sameAs = [settings.instagram, settings.youtube, settings.tiktok, settings.googleMapsUrl].filter(Boolean);
  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': ['Plumber', 'HVACBusiness'],
    '@id': BUSINESS_ID(),
    name: settings.brand,
    legalName: settings.companyName,
    url: abs(homePath(lang)),
    logo: abs('/images/logo-square.jpg'),
    image: abs('/images/og.jpg'),
    telephone: settings.phone.replace(/\s/g, ''),
    priceRange: '€€',
    areaServed: [
      ...settings.areas.map((name) => ({ '@type': 'City', name })),
      { '@type': 'Country', name: 'España' },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: settings.city,
      addressRegion: settings.region,
      addressCountry: 'ES',
      ...(settings.address ? { streetAddress: settings.address } : {}),
      ...(settings.postalCode ? { postalCode: settings.postalCode } : {}),
    },
    knowsLanguage: ['es', 'ru', 'en'],
    sameAs,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: settings.brand,
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title, description: s.short },
      })),
    },
  };
  if (settings.email) data.email = settings.email;
  if (settings.nif) data.taxID = settings.nif;
  if (settings.openingHours) data.openingHours = settings.openingHours;
  if (reviews.length) {
    const avg = reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length;
    data.aggregateRating = { '@type': 'AggregateRating', ratingValue: avg.toFixed(1), reviewCount: reviews.length };
    data.review = reviews.slice(0, 10).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.name },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating || 5 },
      reviewBody: r.text,
      ...(r.date ? { datePublished: r.date } : {}),
    }));
  }
  return data;
}

export function faqSchema(faq: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function serviceSchema(service: Service, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.seoDescription || service.short,
    url: abs(url),
    provider: { '@id': BUSINESS_ID() },
    areaServed: settings.areas.map((name) => ({ '@type': 'City', name })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: service.title,
      itemListElement: service.items.map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } })),
    },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.url) })),
  };
}
