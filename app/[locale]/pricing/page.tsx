"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Check,
  Loader2,
  CreditCard,
  Coins,
  Sparkles,
  Cookie,
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-pranko-lime text-4xl animate-pulse">🧌</div>
        </div>
      }
    >
      <PricingPageInner />
    </Suspense>
  );
}

function PricingPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const prefix = locale === "en" ? "" : `/${locale}`;

  const [loading, setLoading] = useState<string | null>(null); // "single" | "weekly" | null
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  const canceled = searchParams.get("canceled") === "1";
  const fromCreate = searchParams.get("from") === "create";

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => {
        setCredits(d.credits ?? 0);
        setSubscriptionActive(Boolean(d.subscriptionActive));
      })
      .catch(() => setCredits(0));
  }, []);

  async function startCheckout(type: "single" | "weekly") {
    setLoading(type);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, type }),
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
      throw new Error("No checkout URL returned");
    } catch (e: any) {
      setError(e.message || "Checkout failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-12 sm:py-20">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="text-5xl mb-3">💳</div>
          <h1 className="text-display text-4xl sm:text-5xl text-white mb-3">
            Get Your Prank Video
          </h1>
          <p className="text-pranko-muted text-lg max-w-md mx-auto">
            No sign-up required. Pick a plan and start pranking.
          </p>
        </motion.div>

        {canceled && (
          <div className="card-pranko p-4 mb-6 border border-pranko-pink/40 text-center">
            <p className="text-pranko-muted text-sm">
              Checkout canceled. You can try again any time.
            </p>
          </div>
        )}

        {fromCreate && credits === 0 && (
          <div className="card-pranko p-4 mb-6 border-2 border-pranko-lime/40 text-center">
            <p className="text-white">
              <Sparkles size={16} className="inline -mt-1 mr-1 text-pranko-lime" />
              You need credits to generate. Pick a plan below ↓
            </p>
          </div>
        )}

        {/* ── Two plans side by side ──────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Single video */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="card-pranko p-8 border border-pranko-border relative"
          >
            <div className="absolute top-3 right-3 bg-pranko-muted/20 text-pranko-muted font-display font-bold text-xs px-3 py-1 rounded-full">
              ONE-TIME
            </div>
            <div className="text-center mb-6">
              <h2 className="text-display text-2xl text-white mb-2">
                Single Video
              </h2>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-display font-bold text-5xl text-pranko-lime">
                  $1.99
                </span>
                <span className="text-pranko-muted text-lg">/video</span>
              </div>
              <p className="text-pranko-muted text-xs mt-1">
                One credit = one prank video
              </p>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "1 prank video credit",
                "Full 5-second AI-generated video",
                "All prank modes included",
                "Share your video anywhere",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-3 text-pranko-muted"
                >
                  <Check size={18} className="text-pranko-lime shrink-0 mt-0.5" />
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => startCheckout("single")}
              disabled={loading === "single"}
              className="btn-pranko w-full !py-4 glow-lime disabled:opacity-50"
            >
              {loading === "single" ? (
                <><Loader2 className="animate-spin" /> Opening checkout…</>
              ) : (
                <><CreditCard size={18} /> Buy 1 video — $1.99</>
              )}
            </button>
          </motion.div>

          {/* Weekly subscription */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="card-pranko p-8 border-2 border-pranko-lime/40 relative"
          >
            <div className="absolute top-3 right-3 bg-pranko-lime text-pranko-bg font-display font-bold text-xs px-3 py-1 rounded-full">
              BEST VALUE
            </div>
            <div className="text-center mb-6">
              <h2 className="text-display text-2xl text-white mb-2">Weekly</h2>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-display font-bold text-5xl text-pranko-lime">
                  $4.99
                </span>
                <span className="text-pranko-muted text-lg">/week</span>
              </div>
              <p className="text-pranko-muted text-xs mt-1">
                6 credits per week — that's just $0.83/video
              </p>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "6 prank video credits per week",
                "1 credit = 1 five-second AI video",
                "All prank modes included",
                "Credits refresh automatically weekly",
                "Cancel anytime — no questions",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-3 text-pranko-muted"
                >
                  <Check size={18} className="text-pranko-lime shrink-0 mt-0.5" />
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>
            {subscriptionActive ? (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pranko-lime/20 text-pranko-lime text-sm font-semibold mb-4">
                  <Coins size={16} /> Active · {credits} credits left
                </div>
                <Link
                  href={`${prefix}/create`}
                  className="btn-pranko-pink w-full !py-4 glow-pink"
                >
                  <Sparkles size={18} /> Make a prank now
                </Link>
              </div>
            ) : (
              <button
                onClick={() => startCheckout("weekly")}
                disabled={loading === "weekly"}
                className="btn-pranko-pink w-full !py-4 glow-pink disabled:opacity-50"
              >
                {loading === "weekly" ? (
                  <><Loader2 className="animate-spin" /> Opening checkout…</>
                ) : (
                  <><CreditCard size={18} /> Subscribe — $4.99/week</>
                )}
              </button>
            )}
          </motion.div>
        </div>

        {/* ── Cookie warning ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="card-pranko p-5 border border-pranko-pink/30 mb-6"
        >
          <div className="flex items-start gap-3">
            <Cookie size={20} className="text-pranko-pink shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">
                Important: Keep your credits
              </h3>
              <p className="text-pranko-muted text-xs leading-relaxed">
                Your credits are linked to this browser. To keep them:
                <br />
                • Use the <strong>same device and browser</strong> for this site
                <br />
                • Don't clear your cookies or use private/incognito mode
              </p>
            </div>
          </div>
        </motion.div>

        {error && (
          <p className="text-pranko-pink text-sm text-center mb-4">{error}</p>
        )}

        <p className="text-pranko-muted text-xs text-center max-w-md mx-auto">
          Secure checkout by Polar. Card, Apple Pay, Google Pay.
        </p>
      </div>
    </div>
  );
}