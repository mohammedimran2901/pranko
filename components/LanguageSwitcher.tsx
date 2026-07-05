"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Globe, Check } from "lucide-react";
import { locales, type Locale } from "@/i18n";

const LOCALE_INFO: Record<Locale, { label: string; flag: string; native: string }> = {
  en: { label: "English", flag: "🇺🇸", native: "English" },
  fr: { label: "French", flag: "🇫🇷", native: "Français" },
  es: { label: "Spanish", flag: "🇪🇸", native: "Español" },
};

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function switchTo(target: string) {
    setOpen(false);
    // Clear next-intl's locale cookie so the middleware doesn't
    // redirect us back to the old locale on the next request.
    document.cookie = "NEXT_LOCALE=; path=/; max-age=0";
    // Strip the current locale prefix and add the new one
    let path = pathname;
    for (const loc of locales) {
      if (path.startsWith(`/${loc}/`)) {
        path = path.slice(loc.length + 1);
        break;
      }
      if (path === `/${loc}`) {
        path = "/";
        break;
      }
    }
    const newPath = target === "en" ? (path || "/") : `/${target}${path === "/" ? "" : path}`;
    // Use window.location.href for a full page navigation — router.push
    // can silently fail when the resolved URL matches the current page
    // (e.g. switching back from /fr to /).
    window.location.href = newPath;
  }

  const current = LOCALE_INFO[currentLocale as Locale] || LOCALE_INFO.en;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-pranko-muted hover:text-pranko-lime hover:bg-pranko-surface transition-colors text-sm"
        aria-label="Change language"
      >
        <Globe size={16} />
        <span className="hidden sm:inline text-xs font-semibold uppercase">{currentLocale}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-pranko-card border border-pranko-border rounded-xl shadow-xl overflow-hidden z-50">
          {locales.map((loc) => {
            const info = LOCALE_INFO[loc];
            const active = loc === currentLocale;
            return (
              <button
                key={loc}
                onClick={() => switchTo(loc)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-pranko-surface text-left text-sm transition-colors"
              >
                <span className="text-lg">{info.flag}</span>
                <span className="flex-1 text-white">{info.native}</span>
                {active && <Check size={14} className="text-pranko-lime" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
