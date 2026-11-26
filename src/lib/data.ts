import { marked } from 'marked';
import settingsJson from '../data/settings.json';
import homeJson from '../data/home.json';
import privacyJson from '../data/privacy.json';
import type { Lang } from './i18n';

export const settings = settingsJson;

export interface Service {
  id: string;
  order: number;
  icon: string;
  image?: string;
  slug: string;
  title: string;
  short: string;
  items: string[];
  body: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface Review {
  name: string;
  text: string;
  rating: number;
  city?: string;
  date?: string;
  lang?: string;
}

type Localised<T> = Record<Lang, T>;

const serviceFiles = import.meta.glob<Localised<Omit<Service, 'id'>>>('../data/services/*.json', {
  eager: true,
  import: 'default',
});
const reviewFiles = import.meta.glob<Review>('../data/reviews/*.json', { eager: true, import: 'default' });

const fileId = (path: string) => path.split('/').pop()!.replace(/\.json$/, '');

export function getServices(lang: Lang): Service[] {
  return Object.entries(serviceFiles)
    .filter(([, data]) => data[lang]?.slug)
    .map(([path, data]) => ({ id: fileId(path), ...data[lang] }))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export function getServiceById(lang: Lang, id: string): Service | undefined {
  return getServices(lang).find((s) => s.id === id);
}

export function getReviews(): Review[] {
  return Object.values(reviewFiles).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

export const getHome = (lang: Lang) => (homeJson as Localised<any>)[lang];
export const getPrivacy = (lang: Lang) => (privacyJson as Localised<{ title: string; body: string }>)[lang];

export const md = (text = '') => marked.parse(text, { async: false }) as string;

export const telHref = () => `tel:${settings.phone.replace(/[^\d+]/g, '')}`;
export const waHref = (text = '') =>
  `https://wa.me/${settings.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
