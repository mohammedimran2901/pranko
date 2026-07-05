"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { CASE_STUDIES } from "@/lib/case-studies";

/** 4 hero demos (cs1 – cs4) that auto-cycle every 4 s */
const HERO_DEMOS = CASE_STUDIES.slice(0, 4);
const CYCLE_MS = 4000;

/**
 * Conversion-focused hero. Left: copy + CTA. Right: auto-cycling
 * 2‑up phone mockup showing original Unsplash photo vs AI video
 * side by side for cs1 → cs4.
 */
export function Hero() {
  const t = useTranslations("hero");
  const locale = useLocale();
  const router = useRouter();
  const prefix = locale === "en" ? "" : `/${locale}`;

  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Checkout failed");
      }
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
        return;
      }
      throw new Error("No checkout URL");
    } catch (e: any) {
      alert(e.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-28">
      {/* Backgrounds */}
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
      <div className="absolute top-20 -left-20 w-72 h-72 bg-pranko-lime/20 rounded-full blur-3xl animate-blob pointer-events-none" />
      <div className="absolute top-40 -right-20 w-96 h-96 bg-pranko-pink/20 rounded-full blur-3xl animate-blob pointer-events-none" style={{ animationDelay: "2s" }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* ── LEFT: copy + CTA ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Live counter pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pranko-bg/60 backdrop-blur border border-pranko-border text-xs font-semibold text-pranko-muted mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pranko-lime opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pranko-lime" />
              </span>
              <span className="text-pranko-lime font-display font-bold">
                {t("liveCounter")}
              </span>
            </div>

            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight mb-5">
              {t("headline1")}{" "}
              <span className="bg-gradient-pranko bg-clip-text text-transparent">
                {t("headline2")}
              </span>
              <br />
              <span className="text-pranko-muted text-2xl sm:text-3xl lg:text-4xl font-bold block mt-3">
                {t("headline3")}
              </span>
            </h1>

            <p className="text-pranko-muted text-base sm:text-lg max-w-xl lg:max-w-md mx-auto lg:mx-0 mb-7">
              {t("subhead")}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <button
                onClick={startCheckout}
                disabled={loading}
                className="btn-pranko-pink !text-lg !px-8 !py-5 glow-pink inline-flex w-full sm:w-auto justify-center"
              >
                {loading ? (
                  <><Loader2 className="animate-spin" size={20} /> {t("ctaLoading")}</>
                ) : (
                  <><Sparkles size={20} /> {t("cta")} <ArrowRight size={18} /></>
                )}
              </button>
              <Link
                href="#case-studies"
                className="btn-pranko-ghost !text-base !px-6 !py-4 inline-flex w-full sm:w-auto justify-center"
              >
                {t("ctaSecondary")} ↓
              </Link>
            </div>

            {/* Trust strip */}
            <div className="flex items-center gap-4 sm:gap-6 mt-7 justify-center lg:justify-start text-xs text-pranko-muted">
              <div className="flex items-center gap-1.5">
                <CreditCard size={14} className="text-pranko-lime" />
                {t("trustPay")}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-pranko-lime">⚡</span>
                {t("trustTime")}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-pranko-lime">↩️</span>
                {t("trustCancel")}
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT: auto-cycling 2‑up phone mockup ────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <HeroPhoneMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/**
 * Two phone "frames" side by side —  Before (Unsplash) | After (AI video).
 * Auto-cycles through cs1..cs4 every 4 s with a crossfade.
 */
function HeroPhoneMockup() {
  const t = useTranslations("hero");
  const tCase = useTranslations("caseStudies");
  const [index, setIndex] = useState(0);
  const demo = HERO_DEMOS[index];

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % HERO_DEMOS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(advance, CYCLE_MS);
    return () => clearInterval(timer);
  }, [advance]);

  return (
    <div className="relative max-w-md mx-auto">
      {/* Two phones */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* BEFORE phone */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`before-${demo.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <PhoneFrame label="Before" tone="muted">
              <img
                src={demo.beforeImage}
                alt={demo.beforeAlt}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </PhoneFrame>
          </motion.div>
        </AnimatePresence>

        {/* AFTER phone */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`after-${demo.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <PhoneFrame label="After · AI" tone="lime">
              <div className={`absolute inset-0 bg-gradient-to-br ${demo.afterFallbackGradient}`} />
              <video
                src={demo.afterVideo}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLVideoElement).style.display = "none";
                }}
              />
              {/* Emoji fallback (shown behind video, hidden when video plays) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-7xl opacity-90 drop-shadow-lg select-none">{demo.emoji}</span>
              </div>
            </PhoneFrame>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Animated arrow between */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-pranko-lime text-pranko-bg flex items-center justify-center font-display font-bold text-xl sm:text-2xl shadow-2xl glow-lime z-10"
        >
          🪄
        </motion.div>
      </div>

      {/* Category / title under the phones */}
      <div className="mt-5 text-center">
        <p className="text-white font-display font-bold text-sm sm:text-base mb-1">
          {tCase(`${demo.id}.title`)}
        </p>
        <p className="text-pranko-muted text-xs leading-snug max-w-xs mx-auto">
          {tCase(`${demo.id}.story`)}
        </p>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {HERO_DEMOS.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setIndex(i)}
            className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
              i === index
                ? "bg-pranko-lime glow-lime"
                : "bg-pranko-border hover:bg-pranko-muted/60"
            }`}
            aria-label={`Show ${tCase(`${d.id}.title`)} demo`}
          />
        ))}
      </div>

      {/* Floating tech-stack caption */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pranko-bg/80 backdrop-blur border border-pranko-border text-xs font-semibold text-pranko-muted">
          <Sparkles size={12} className="text-pranko-lime" />
          {t("mockupCaption")}
        </div>
      </div>
    </div>
  );
}

function PhoneFrame({
  children,
  label,
  tone,
}: {
  children: React.ReactNode;
  label: string;
  tone: "muted" | "lime";
}) {
  return (
    <div className="relative aspect-[9/16] rounded-3xl overflow-hidden border-4 border-pranko-border bg-pranko-card shadow-2xl">
      {children}
      {/* notch */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-pranko-bg/60" />
      {/* label badge */}
      <div
        className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-display font-bold uppercase tracking-wider ${
          tone === "lime"
            ? "bg-pranko-lime text-pranko-bg"
            : "bg-pranko-bg/80 text-white backdrop-blur"
        }`}
      >
        {label}
      </div>
    </div>
  );
}
