"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Menu, X } from "lucide-react";

export function Navbar({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  const prefix = locale === "en" ? "" : `/${locale}`;

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
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher currentLocale={locale} />
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
