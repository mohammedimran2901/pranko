"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Sparkles } from "lucide-react";

export default function LandingPage() {
  const locale = useLocale();
  const t = useTranslations();
  const prefix = locale === "en" ? "" : `/${locale}`;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden pt-12 pb-24 sm:pt-16 sm:pb-32">
        <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
        <div className="absolute top-20 -left-20 w-72 h-72 bg-pranko-lime/20 rounded-full blur-3xl animate-blob pointer-events-none" />
        <div className="absolute top-40 -right-20 w-96 h-96 bg-pranko-pink/20 rounded-full blur-3xl animate-blob pointer-events-none" style={{ animationDelay: "2s" }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-7xl sm:text-8xl mb-6 animate-float-slow">🧌</div>

          <h1 className="font-display font-bold text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-tight max-w-4xl mx-auto mb-6">
            {t("hero.headline1")}
            <br />
            <span className="bg-gradient-pranko bg-clip-text text-transparent">
              {t("hero.headline2")}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-pranko-muted max-w-2xl mx-auto mb-8">
            {t("hero.subhead")}
          </p>

          <Link
            href={`${prefix}/create`}
            className="btn-pranko !text-lg sm:!text-xl !px-10 sm:!px-14 !py-5 glow-lime inline-flex items-center gap-2"
          >
            {t("hero.cta")} <Sparkles size={20} />
          </Link>

          <p className="text-pranko-muted text-sm mt-3">{t("hero.ctaSub")}</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-pranko-surface/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-display text-3xl sm:text-5xl text-center mb-12 text-white">
            {t("howItWorks.title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { n: "1", icon: "📸", title: t("howItWorks.steps.1.title"), desc: t("howItWorks.steps.1.desc") },
              { n: "2", icon: "✍️", title: t("howItWorks.steps.2.title"), desc: t("howItWorks.steps.2.desc") },
              { n: "3", icon: "🎬", title: t("howItWorks.steps.3.title"), desc: t("howItWorks.steps.3.desc") },
            ].map((step) => (
              <div key={step.n} className="card-pranko p-6 text-center relative">
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-pranko-lime text-pranko-bg font-display font-bold flex items-center justify-center text-lg">
                  {step.n}
                </div>
                <div className="text-5xl mb-3 mt-2">{step.icon}</div>
                <h3 className="font-display font-bold text-lg text-white mb-2">{step.title}</h3>
                <p className="text-pranko-muted text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-pranko opacity-10 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-display text-4xl sm:text-6xl mb-4 text-white leading-[1.05]">
            {t("cta.title")}
          </h2>
          <p className="text-pranko-muted text-lg mb-8">{t("cta.subtitle")}</p>
          <Link href={`${prefix}/create`} className="btn-pranko-pink !text-lg sm:!text-xl !px-10 sm:!px-14 !py-5 glow-pink inline-flex items-center gap-2">
            {t("cta.button")} <Sparkles size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}