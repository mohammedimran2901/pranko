"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Zap, Heart, Star, Flame } from "lucide-react";
import { getTemplateById } from "@/lib/templates";
import { TEMPLATE_TRANSLATIONS } from "@/lib/template-i18n";
import { useLocale } from "next-intl";

const FALLBACK_LOCALE = "en" as const;

export default function LandingPage() {
  const locale = useLocale();
  const t = useTranslations();
  const tHero = useTranslations("hero");
  const tBeforeAfter = useTranslations("beforeAfter");
  const tModes = useTranslations("modes");
  const tHow = useTranslations("howItWorks");
  const tSocial = useTranslations("social");
  const tPricing = useTranslations("pricing");
  const tFaq = useTranslations("faq");
  const tCta = useTranslations("cta");

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const tKey = (k: string) =>
    (TEMPLATE_TRANSLATIONS as any)[locale]?.[k] ??
    (TEMPLATE_TRANSLATIONS as any)[FALLBACK_LOCALE]?.[k] ??
    k;

  const prefix = locale === "en" ? "" : `/${locale}`;

  // Pick the 6 hero before/afters (mix of modes)
  const heroExamples = [
    { id: "ex-lambo", key: "crash" },
    { id: "ex-rolex", key: "rolex" },
    { id: "mom-grammy", key: "grammy" },
    { id: "ex-mansion", key: "mansion" },
    { id: "boss-ceo", key: "promotion" },
    { id: "crush-vacation", key: "fish" },
  ];

  // Display order: 6 single-image modes first, then Merge as the new "wow" feature
  const allModes = ["ex", "boss", "mom", "roommate", "crush", "merge", "custom"];

  return (
    <>
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden pt-8 pb-20 sm:pt-12 sm:pb-28">
        <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
        <div className="absolute top-20 -left-20 w-72 h-72 bg-pranko-lime/20 rounded-full blur-3xl animate-blob pointer-events-none" />
        <div className="absolute top-40 -right-20 w-96 h-96 bg-pranko-pink/20 rounded-full blur-3xl animate-blob pointer-events-none" style={{ animationDelay: "2s" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          {/* Live counter */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-pranko-surface/60 backdrop-blur border border-pranko-border rounded-full px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pranko-lime opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pranko-lime" />
              </span>
              <span className="text-xs sm:text-sm text-pranko-muted">
                {tHero("liveCounter")}
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center font-display font-bold text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-tight max-w-5xl mx-auto"
          >
            {tHero("headline1")}
            <br />
            <span className="bg-gradient-pranko bg-clip-text text-transparent">
              {tHero("headline2")}
            </span>
          </motion.h1>

          {/* Goblin mascot */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
            className="flex justify-center my-6"
          >
            <div className="text-7xl sm:text-8xl animate-float-slow">🧌</div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-base sm:text-lg text-pranko-muted max-w-2xl mx-auto"
          >
            {tHero("subhead")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-3 mt-8"
          >
            <Link href={`${prefix}/create?mode=merge`} className="btn-pranko !text-lg sm:!text-xl !px-10 sm:!px-14 !py-5 glow-lime">
              🪄 Try Merge Mode
            </Link>
            <p className="text-pranko-muted text-sm">{tHero("ctaSub")}</p>
            <div className="flex items-center gap-4 text-xs text-pranko-muted mt-2">
              <span>{tHero("trustPhoto")}</span>
              <span>·</span>
              <span>{tHero("trustTime")}</span>
              <span>·</span>
              <span>{tHero("trustFree")}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== BEFORE / AFTER (Hero examples) ========== */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-display text-3xl sm:text-5xl mb-3">
              <span className="text-pranko-lime">{tBeforeAfter("title")}</span>
            </h2>
            <p className="text-pranko-muted text-lg">{tBeforeAfter("subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {heroExamples.map((ex, i) => {
              const template = getTemplateById(ex.id);
              if (!template) return null;
              return (
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="card-pranko overflow-hidden group"
                >
                  {/* Before/After preview */}
                  <div className="relative aspect-[4/3] bg-pranko-card overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-2">
                      <div className="bg-pranko-surface flex items-center justify-center text-4xl sm:text-6xl grayscale opacity-50">
                        {template.emoji}
                      </div>
                      <div className="bg-gradient-pranko flex items-center justify-center text-4xl sm:text-6xl">
                        {template.emoji}
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 bg-pranko-bg/80 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded">BEFORE</div>
                    <div className="absolute top-2 right-2 bg-pranko-lime text-pranko-bg text-[10px] font-bold px-2 py-0.5 rounded">AFTER ✨</div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-bold text-base text-white mb-1">
                      {tBeforeAfter(`examples.${ex.key}.title`)}
                    </h3>
                    <p className="text-pranko-muted text-sm leading-snug">
                      {tBeforeAfter(`examples.${ex.key}.desc`)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== PRANK MODES ========== */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-pranko-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-pranko-lime text-xs font-display tracking-widest uppercase mb-2">🎯 Pranko Modes</span>
            <h2 className="text-display text-3xl sm:text-5xl mb-3 text-white">
              {tModes("title")}
            </h2>
            <p className="text-pranko-muted text-lg">{tModes("subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allModes.map((mode, i) => (
              <motion.div
                key={mode}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`${prefix}/create?mode=${mode}`}
                  className={`card-pranko block p-6 group hover:scale-[1.02] transition-transform relative ${
                    mode === "merge" ? "border-pranko-cyan/60 bg-pranko-cyan/5 hover:border-pranko-cyan" : ""
                  }`}
                >
                  {mode === "merge" && (
                    <div className="absolute -top-3 right-4 bg-pranko-cyan text-pranko-bg text-[10px] font-display font-bold px-2 py-0.5 rounded-full tracking-wider">
                      NEW
                    </div>
                  )}
                  <div className="text-5xl mb-3">{tModes(`${mode}.emoji`)}</div>
                  <h3 className="font-display font-bold text-xl text-white mb-1 group-hover:text-pranko-lime transition-colors">
                    {tModes(`${mode}.name`)}
                  </h3>
                  <p className="text-pranko-lime text-sm font-semibold mb-2">{tModes(`${mode}.tagline`)}</p>
                  <p className="text-pranko-muted text-sm leading-snug">{tModes(`${mode}.desc`)}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-pranko-pink text-xs font-display tracking-widest uppercase mb-2">⚡ The Process</span>
            <h2 className="text-display text-3xl sm:text-5xl mb-3 text-white">{tHow("title")}</h2>
            <p className="text-pranko-muted text-lg">{tHow("subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: "1", icon: "🎭", key: "1" },
              { n: "2", icon: "📸", key: "2" },
              { n: "3", icon: "🧌", key: "3" },
              { n: "4", icon: "🚀", key: "4" },
            ].map((step) => (
              <div key={step.n} className="card-pranko p-6 text-center relative">
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-pranko-lime text-pranko-bg font-display font-bold flex items-center justify-center text-lg">
                  {step.n}
                </div>
                <div className="text-5xl mb-3 mt-2">{step.icon}</div>
                <h3 className="font-display font-bold text-lg text-white mb-2">{tHow(`steps.${step.key}.title`)}</h3>
                <p className="text-pranko-muted text-sm">{tHow(`steps.${step.key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-pranko-surface/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-pranko-cyan text-xs font-display tracking-widest uppercase mb-2">💸 Pricing</span>
            <h2 className="text-display text-3xl sm:text-5xl mb-3 text-white">{tPricing("title")}</h2>
            <p className="text-pranko-muted text-lg">{tPricing("subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Free */}
            <PricingCard
              name={tPricing("free.name")}
              price={tPricing("free.price")}
              tagline={tPricing("free.tagline")}
              features={tPricing.raw("free.features") as string[]}
              cta={tPricing("free.cta")}
              href={`${prefix}/create?tier=free`}
              variant="ghost"
            />
            {/* Single */}
            <PricingCard
              name={tPricing("single.name")}
              price={tPricing("single.price")}
              tagline={tPricing("single.tagline")}
              features={tPricing.raw("single.features") as string[]}
              cta={tPricing("single.cta")}
              href={`${prefix}/create?tier=single`}
              variant="lime"
            />
            {/* Pack (Popular) */}
            <PricingCard
              name={tPricing("pack.name")}
              price={tPricing("pack.price")}
              tagline={tPricing("pack.tagline")}
              features={tPricing.raw("pack.features") as string[]}
              cta={tPricing("pack.cta")}
              href={`${prefix}/create?tier=pack`}
              variant="pink"
              popular
              popularLabel={tPricing("pack.popular") as string}
            />
            {/* Pro */}
            <PricingCard
              name={tPricing("pro.name")}
              price={tPricing("pro.price")}
              per={tPricing("pro.per")}
              tagline={tPricing("pro.tagline")}
              features={tPricing.raw("pro.features") as string[]}
              cta={tPricing("pro.cta")}
              href={`${prefix}/create?tier=pro`}
              variant="purple"
            />
            {/* Lifetime */}
            <PricingCard
              name={tPricing("lifetime.name")}
              price={tPricing("lifetime.price")}
              tagline={tPricing("lifetime.tagline")}
              features={tPricing.raw("lifetime.features") as string[]}
              cta={tPricing("lifetime.cta")}
              href={`${prefix}/create?tier=lifetime`}
              variant="cyan"
              badge={tPricing("lifetime.save") as string}
            />
          </div>
        </div>
      </section>

      {/* ========== SOCIAL PROOF ========== */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-display text-3xl sm:text-4xl mb-12 text-white">
            <Flame className="inline text-pranko-orange mb-1" /> {tSocial("title")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { n: "47,382", l: tSocial("pranksCreated"), c: "text-pranko-lime" },
              { n: "189k", l: tSocial("reactions"), c: "text-pranko-pink" },
              { n: "12,841", l: tSocial("tiktoks"), c: "text-pranko-cyan" },
              { n: "∞", l: tSocial("happy"), c: "text-pranko-yellow" },
            ].map((s, i) => (
              <div key={i} className="card-pranko p-5 text-center">
                <div className={`font-display font-bold text-3xl sm:text-4xl ${s.c}`}>{s.n}</div>
                <div className="text-pranko-muted text-xs sm:text-sm mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-pranko-surface/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-display text-3xl sm:text-4xl text-center mb-12 text-white">
            {tFaq("title")}
          </h2>
          <div className="space-y-3">
            {["legal", "stored", "real", "cancel", "refund", "languages", "merge"].map((key, i) => (
              <div key={key} className="card-pranko overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left flex justify-between items-center p-5"
                >
                  <span className="font-display font-bold text-white pr-4">{tFaq(`items.${key}.q`)}</span>
                  <span className={`text-pranko-lime text-2xl transition-transform duration-300 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-96" : "max-h-0"}`}>
                  <p className="text-pranko-muted text-sm leading-relaxed px-5 pb-5">
                    {tFaq(`items.${key}.a`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-pranko opacity-10 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-display text-4xl sm:text-6xl mb-4 text-white leading-[1.05]">
            {tCta("title")}
          </h2>
          <p className="text-pranko-muted text-lg mb-8">{tCta("subtitle")}</p>
          <Link href={`${prefix}/create`} className="btn-pranko-pink !text-lg sm:!text-xl !px-10 sm:!px-14 !py-5 glow-pink">
            {tCta("button")} <Heart size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}

// ========== PRICING CARD COMPONENT ==========
function PricingCard({
  name,
  price,
  per,
  tagline,
  features,
  cta,
  href,
  variant,
  popular,
  popularLabel,
  badge,
}: {
  name: string;
  price: string;
  per?: string;
  tagline: string;
  features: string[];
  cta: string;
  href: string;
  variant: "lime" | "pink" | "purple" | "cyan" | "ghost";
  popular?: boolean;
  popularLabel?: string;
  badge?: string;
}) {
  const variantClasses = {
    lime:   "border-pranko-lime/40 hover:border-pranko-lime bg-pranko-lime/5",
    pink:   "border-pranko-pink/60 bg-pranko-pink/10 hover:border-pranko-pink",
    purple: "border-pranko-purple/40 hover:border-pranko-purple bg-pranko-purple/5",
    cyan:   "border-pranko-cyan/40 hover:border-pranko-cyan bg-pranko-cyan/5",
    ghost:  "border-pranko-border hover:border-pranko-lime/40",
  };
  const accentColor = {
    lime: "text-pranko-lime",
    pink: "text-pranko-pink",
    purple: "text-pranko-purple",
    cyan: "text-pranko-cyan",
    ghost: "text-white",
  }[variant];

  return (
    <div className={`relative card-pranko p-6 ${variantClasses[variant]}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pranko-pink text-white text-[10px] font-display font-bold px-3 py-1 rounded-full tracking-wider">
          {popularLabel}
        </div>
      )}
      {badge && !popular && (
        <div className="absolute -top-3 right-4 bg-pranko-cyan text-pranko-bg text-[10px] font-display font-bold px-2 py-0.5 rounded-full">
          {badge}
        </div>
      )}
      <h3 className="font-display font-bold text-2xl text-white mb-1">{name}</h3>
      <p className="text-pranko-muted text-sm mb-4">{tagline}</p>
      <div className="flex items-baseline gap-1 mb-5">
        <span className={`font-display font-bold text-4xl ${accentColor}`}>{price}</span>
        {per && <span className="text-pranko-muted text-sm">{per}</span>}
      </div>
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-pranko-muted">
            <span className={`mt-0.5 ${accentColor}`}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link href={href} className={`${variant === "pink" ? "btn-pranko-pink" : "btn-pranko"} w-full text-center`}>
        {cta}
      </Link>
    </div>
  );
}
