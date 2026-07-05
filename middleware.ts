import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Pranko middleware: refreshes Supabase auth session on every request.
 * This keeps the magic-link session alive without the user needing to
 * re-authenticate every time they visit.
 */
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  // Skip if Supabase is not configured.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return res;
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
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
                // Ensure cookies work across the full site.
                path: "/",
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
              });
            }
          },
        },
      }
    );

    // Refresh the session if it exists. This is a no-op for anonymous users.
    await supabase.auth.getSession();
  } catch {
    // Auth not critical for page rendering — don't block the request.
  }

  return res;
}

export const config = {
  matcher: [
    // Apply to all routes except static files and Next.js internals.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|css|js|woff2?)$).*)",
  ],
};