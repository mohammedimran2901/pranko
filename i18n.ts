import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'fr', 'es'] as const;
export const defaultLocale = 'en' as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  // This requires "next-intl" >= 3.22
  const locale = await requestLocale;
  if (!locales.includes(locale as any)) notFound();

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});