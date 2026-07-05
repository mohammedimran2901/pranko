"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Menu, X, User, LogOut, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function Navbar({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const prefix = locale === "en" ? "" : `/${locale}`;

  // Check if user is signed in (silently, don't block rendering).
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!cancelled && data.user) {
          setUserEmail(data.user.email ?? "Signed in");
        }
      } catch {
        // Supabase not configured or not signed in — ignore.
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setUserEmail(null);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-pranko-bg/80 border-b border-pranko-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href={`${prefix}/`} className="flex items-center gap-2 no-select">
          <div className="text-2xl">🧌</div>
          <span className="font-display font-bold text-xl tracking-tight">
            <span className="text-pranko-lime">P</span>
            <span>ranko</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href={`${prefix}/create`} className="text-sm font-medium text-pranko-muted hover:text-pranko-lime transition-colors">
            {t("create")}
          </Link>
          <Link href={`${prefix}/trending`} className="text-sm font-medium text-pranko-muted hover:text-pranko-lime transition-colors">
            {t("trending")}
          </Link>
          <Link href={`${prefix}/pricing`} className="text-sm font-medium text-pranko-muted hover:text-pranko-lime transition-colors">
            {t("pricing")}
          </Link>
          <Link href={`${prefix}/account`} className="text-sm font-medium text-pranko-muted hover:text-pranko-lime transition-colors">
            Account
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher currentLocale={locale} />

          {/* Auth button */}
          {userEmail ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href={`${prefix}/account`}
                className="flex items-center gap-1.5 text-sm text-pranko-muted hover:text-white transition-colors"
                title={userEmail}
              >
                <User size={16} />
                <span className="max-w-[120px] truncate">{userEmail}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 text-pranko-muted hover:text-pranko-pink transition-colors"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              href={`${prefix}/login`}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-pranko-muted hover:text-pranko-lime transition-colors"
            >
              <LogIn size={16} /> Sign in
            </Link>
          )}

          <Link href={`${prefix}/create`} className="hidden sm:inline-flex btn-pranko !py-2 !px-4 !text-sm">
            {t("start")} 🎭
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-pranko-muted hover:text-pranko-lime"
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-pranko-border bg-pranko-surface">
          <nav className="flex flex-col p-4 gap-3">
            {userEmail ? (
              <>
                <div className="flex items-center gap-2 py-2 text-pranko-muted">
                  <User size={16} />
                  <span className="truncate">{userEmail}</span>
                </div>
                <Link href={`${prefix}/account`} onClick={() => setOpen(false)} className="py-2 text-pranko-muted hover:text-pranko-lime">
                  Account
                </Link>
                <button
                  onClick={() => { handleLogout(); setOpen(false); }}
                  className="py-2 text-left text-pranko-muted hover:text-pranko-pink"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link href={`${prefix}/login`} onClick={() => setOpen(false)} className="py-2 text-pranko-muted hover:text-pranko-lime">
                Sign in
              </Link>
            )}
            <div className="border-t border-pranko-border my-1" />
            <Link href={`${prefix}/create`} onClick={() => setOpen(false)} className="py-2 text-pranko-muted hover:text-pranko-lime">
              {t("create")}
            </Link>
            <Link href={`${prefix}/trending`} onClick={() => setOpen(false)} className="py-2 text-pranko-muted hover:text-pranko-lime">
              {t("trending")}
            </Link>
            <Link href={`${prefix}/pricing`} onClick={() => setOpen(false)} className="py-2 text-pranko-muted hover:text-pranko-lime">
              {t("pricing")}
            </Link>
            <Link href={`${prefix}/create`} onClick={() => setOpen(false)} className="btn-pranko !text-sm mt-2">
              {t("start")} 🎭
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}