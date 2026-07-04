"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Sparkles } from "lucide-react";
import { Hero } from "@/components/Hero";
import { CaseStudies } from "@/components/CaseStudies";

export default function LandingPage() {
  const locale = useLocale();
  const t = useTranslations();
  const prefix = locale === "en" ? "" : `/${locale}`;

  return (
    <>
      {/* ── Hero: phone mockup + dual CTA + $4.99 headline ────── */}
      <Hero />

      {/* ── Case studies: 5 real pranks made with Pranko ──────── */}
      <div id="case-studies">
        <CaseStudies />
      </div>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-pranko opacity-10 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-display text-4xl sm:text-6xl mb-4 text-white leading-[1.05]">
            {t("cta.title")}
          </h2>
          <p className="text-pranko-muted text-lg mb-8">
            {t("cta.subtitle")}
          </p>
          <Link
            href={`${prefix}/create`}
            className="btn-pranko-pink !text-lg sm:!text-xl !px-10 sm:!px-14 !py-5 glow-pink inline-flex"
          >
            <Sparkles size={20} /> {t("cta.button")}
          </Link>
        </div>
      </section>
    </>
  );
}
