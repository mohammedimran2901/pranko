"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { CreditCard, Sparkles, ArrowRight, Loader2 } from "lucide-react";

/**
 * Conversion-focused hero. No more floating ogre. Just:
 *   - Concrete offer ($4.99/week · 6 credits)
 *   - Phone mockup showing the before/after of cs1
 *   - Live counter for social proof
 *   - Primary CTA → Polar checkout, secondary CTA → scroll to case studies
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

          {/* ── RIGHT: 2-up phone mockup (cs1 demo) ────────────── */}
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
 * Two phone "frames" side by side. Left = the real Unsplash selfie
 * (from cs1.beforeImage). Right = the AI video (cs1.afterVideo) on
 * top of the cs1 gradient poster. Animated arrow between them.
 *
 * If the MP4 isn't there yet, the gradient + emoji stand in (still
 * shows the concept clearly).
 */
function HeroPhoneMockup() {
  const t = useTranslations("hero");
  return (
    <div className="relative max-w-md mx-auto">
      {/* Two phones */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* BEFORE phone */}
        <PhoneFrame label="Before" tone="muted">
          <img
            src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&auto=format&fit=crop"
            alt="Original watch photo"
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </PhoneFrame>

        {/* AFTER phone */}
        <PhoneFrame label="After · AI" tone="lime">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-rose-600 to-amber-700" />
          <video
            src="/showcase/cs1.mp4"
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
          {/* Emoji fallback for the case when the video file doesn't exist yet */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-7xl opacity-90 drop-shadow-lg select-none">⌚💥</span>
          </div>
        </PhoneFrame>
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

      {/* Floating label under */}
      <div className="mt-6 text-center">
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
