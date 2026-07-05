import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale } from "@/i18n";

/**
 * Pranko middleware: locale routing (next-intl) + Supabase auth session refresh.
 */

// The next-intl middleware handles locale prefix / redirect.
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed", // /en/... for non-default, /... for default
});

export async function middleware(req: NextRequest) {
  // 1. Run the next-intl locale routing middleware.
  const res = intlMiddleware(req);

  // 2. Refresh Supabase auth session (if configured).
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const { createServerClient } = await import("@supabase/ssr");
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return req.cookies.getAll().map((c) => ({
              name: c.name,
              value: c.value,
            }));
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              res.cookies.set(name, value, {
                ...options,
                path: "/",
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
              });
            }
          },
        },
      });
      await supabase.auth.getSession();
    } catch {
      // Auth not critical — don't block.
    }
  }

  return res;
}

export const config = {
  matcher: [
    // Match all paths except static files, api routes, and Next.js internals.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|css|js|woff2?)$).*)",
  ],
};