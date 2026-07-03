import { useTranslations } from "next-intl";
import Link from "next/link";

export function Footer({ locale }: { locale: string }) {
  const t = useTranslations("footer");
  const prefix = locale === "en" ? "" : `/${locale}`;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-pranko-border bg-pranko-surface/30 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <p className="font-display font-bold text-pranko-lime text-lg flex items-center gap-2 no-select">
            <span>🧌</span> Pranko
          </p>
          <p className="text-pranko-muted text-xs mt-1">{t("tagline")}</p>
        </div>
        <nav className="flex items-center gap-5 text-pranko-muted text-sm">
          <a href="https://tiktok.com/@pranko" target="_blank" rel="noopener" className="hover:text-pranko-lime transition-colors">
            {t("tiktok")}
          </a>
          <a href="https://instagram.com/pranko.app" target="_blank" rel="noopener" className="hover:text-pranko-lime transition-colors">
            {t("instagram")}
          </a>
          <Link href={`${prefix}/legal/privacy`} className="hover:text-pranko-lime transition-colors">{t("privacy")}</Link>
          <Link href={`${prefix}/legal/terms`} className="hover:text-pranko-lime transition-colors">{t("terms")}</Link>
          <a href="mailto:hello@pranko.app" className="hover:text-pranko-lime transition-colors">{t("contact")}</a>
        </nav>
        <p className="text-pranko-muted text-xs">© {year} Pranko</p>
      </div>
    </footer>
  );
}
