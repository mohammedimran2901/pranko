import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // /en/page, /fr/page, /es/page, but / is defaultLocale
});

export const config = {
  // Match all paths except: api, _next, _vercel, .. files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
