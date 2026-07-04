"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Check, Loader2, CreditCard, Coins, Sparkles } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-pranko-lime text-4xl animate-pulse">🧌</div></div>}>
      <PricingPageInner />
    </Suspense>
  );
}

function PricingPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const prefix = locale === "en" ? "" : `/${locale}`;

  const [loading, setLoading] = useState(false);
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

  async function startCheckout() {
    setLoading(true);
    setError(null);
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
      throw new Error("No checkout URL returned");
    } catch (e: any) {
      setError(e.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-12 sm:py-20">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="text-5xl mb-3">💳</div>
          <h1 className="text-display text-4xl sm:text-5xl text-white mb-3">
            Pranko Weekly
          </h1>
          <p className="text-pranko-muted text-lg">
            6 prank videos every week. Cancel anytime.
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
              You need a subscription to generate prank videos. Pick a plan below ↓
            </p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card-pranko p-8 border-2 border-pranko-lime/40 mb-6 relative overflow-hidden"
        >
          <div className="absolute top-3 right-3 bg-pranko-lime text-pranko-bg font-display font-bold text-xs px-3 py-1 rounded-full">
            THE PLAN
          </div>

          <div className="text-center mb-6">
            <h2 className="text-display text-2xl text-white mb-2">Weekly</h2>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-display font-bold text-6xl text-pranko-lime">$4.99</span>
              <span className="text-pranko-muted text-lg">/week</span>
            </div>
          </div>

          <ul className="space-y-3 mb-8">
            {[
              "6 prank video credits per week",
              "1 credit = 1 five-second AI prank video",
              "All prank modes (ex, boss, mom, roommate, crush, merge)",
              "Credits refresh automatically every week",
              "Cancel anytime — no questions asked",
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-pranko-muted">
                <Check size={18} className="text-pranko-lime shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base">{feature}</span>
              </li>
            ))}
          </ul>

          {subscriptionActive ? (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pranko-lime/20 text-pranko-lime text-sm font-semibold mb-4">
                <Coins size={16} /> Subscription active · {credits} credits left
              </div>
              <Link
                href={`${prefix}/create`}
                className="btn-pranko w-full !text-lg !py-5 glow-lime"
              >
                <Sparkles size={18} /> Make a prank now
              </Link>
            </div>
          ) : (
            <>
              <button
                onClick={startCheckout}
                disabled={loading}
                className="btn-pranko-pink w-full !text-xl !py-5 glow-pink"
              >
                {loading ? (
                  <><Loader2 className="animate-spin" /> Opening checkout…</>
                ) : (
                  <><CreditCard size={20} /> Subscribe — $4.99/week</>
                )}
              </button>
              <p className="text-pranko-muted text-xs text-center mt-3">
                Secure checkout by Polar. Card, Apple Pay, Google Pay.
              </p>
            </>
          )}

          {error && (
            <p className="text-pranko-pink text-sm text-center mt-3">{error}</p>
          )}
        </motion.div>

        <p className="text-pranko-muted text-xs text-center max-w-md mx-auto">
          By subscribing you agree to our{" "}
          <Link href={`${prefix}/legal/terms`} className="underline hover:text-white">
            terms
          </Link>{" "}
          and{" "}
          <Link href={`${prefix}/legal/privacy`} className="underline hover:text-white">
            privacy policy
          </Link>
          . Don't use Pranko to defraud, harass, or harm anyone — be kind, be funny, don't be a clown (well, do be a clown, but a nice one).
        </p>
      </div>
    </div>
  );
}
