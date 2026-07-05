"use client";

import { useEffect, Suspense, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Sparkles, Loader2, ArrowRight, Coins, RotateCw, AlertCircle,
} from "lucide-react";

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 20;

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-pranko-lime text-4xl animate-pulse">🧌</div></div>}>
      <SuccessPageInner />
    </Suspense>
  );
}

function SuccessPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("result");
  const prefix = locale === "en" ? "" : `/${locale}`;

  const checkoutId = searchParams.get("checkout_id");

  const [credits, setCredits] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubscription, setIsSubscription] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollAttempts, setPollAttempts] = useState(0);
  const confirmedRef = useRef(false);

  const confirmCheckout = useCallback(async () => {
    if (confirmedRef.current || !checkoutId) return;
    try {
      const res = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 400) { setError("Invalid checkout session."); return; }
        return;
      }
      const data = await res.json();
      if (data.confirmed) {
        setCredits(data.credits ?? 1);
        setIsSubscription(data.subscriptionActive ?? false);
        setConfirmed(true);
        confirmedRef.current = true;
      } else {
        setCredits(0);
      }
    } catch (e: any) {
      console.error("confirm checkout error:", e);
    }
  }, [checkoutId]);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      if (confirmedRef.current) return;
      if (checkoutId) {
        await confirmCheckout();
      } else {
        try {
          const res = await fetch("/api/credits", { cache: "no-store" });
          if (!res.ok) return;
          const data = await res.json();
          if (cancelled || confirmedRef.current) return;
          const c = data.credits ?? 0;
          setCredits(c);
          setIsSubscription(data.subscriptionActive ?? false);
          if (c > 0) { setConfirmed(true); confirmedRef.current = true; return; }
        } catch {}
      }
      if (cancelled) return;
      if (pollAttempts < MAX_POLL_ATTEMPTS && !confirmedRef.current) {
        setPollAttempts((n) => n + 1);
        setTimeout(() => { if (!cancelled) tick(); }, POLL_INTERVAL_MS);
      } else if (!confirmedRef.current) {
        if (credits === null) setCredits(0);
      }
    }
    const initialDelay = setTimeout(() => { if (!cancelled) tick(); }, 500);
    return () => { cancelled = true; clearTimeout(initialDelay); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutId, pollAttempts]);

  const isTimedOut = pollAttempts >= MAX_POLL_ATTEMPTS && !confirmed && credits !== null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
        <div className="text-7xl mb-4">{confirmed ? "🎉" : isTimedOut ? "⏳" : "🎉"}</div>
        <h1 className="text-display text-3xl sm:text-4xl text-white mb-4">
          {confirmed ? "You're in!" : isTimedOut ? "Payment received, confirming…" : "You're in!"}
        </h1>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pranko-lime/20 text-pranko-lime font-display font-bold text-lg mb-4">
          <Coins size={18} />
          {!confirmed && credits === null ? (<span className="inline-flex items-center gap-1"><Loader2 className="animate-spin" size={16} /> Checking…</span>)
          : credits && credits > 0 ? (<>{credits} credit{credits === 1 ? "" : "s"} ready</>)
          : (<>{credits ?? 0} credits ready</>)}
        </div>

        {confirmed && (
          <>
            {isSubscription ? (
              <>
                <p className="text-pranko-muted mb-2">{t("subscriptionDesc")}</p>
                <p className="text-pranko-muted text-xs mb-8">{t("subscriptionRenew")}</p>
              </>
            ) : (
              <>
                <p className="text-pranko-muted mb-2">Your credit is ready. 1 credit = 1 prank video.</p>
                <p className="text-pranko-muted text-xs mb-8">Buy more anytime at the same price.</p>
              </>
            )}
            <button onClick={() => router.push(`${prefix}/create`)} className="btn-pranko !text-lg !px-10 !py-5 glow-lime w-full">
              <Sparkles size={20} /> {t("makeFirstPrank")} <ArrowRight size={18} />
            </button>
          </>
        )}

        {!confirmed && (
          <>
            {isTimedOut ? (
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 text-pranko-pink mb-3">
                  <AlertCircle size={18} />
                  <p className="text-sm">Your payment went through but credits are taking a moment to appear.</p>
                </div>
                <button onClick={() => { setPollAttempts(0); setError(null); setCredits(null); confirmedRef.current = false; }} className="btn-pranko !bg-pranko-lime/20 !text-pranko-lime hover:!bg-pranko-lime/30 !px-6 !py-3">
                  <RotateCw size={16} /> Check again
                </button>
              </div>
            ) : (
              <div className="mb-6">
                <p className="text-pranko-muted text-sm flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={14} />
                  Securing your credits…{pollAttempts > 2 && <span className="text-xs opacity-60">(this usually takes a few seconds)</span>}
                </p>
              </div>
            )}
          </>
        )}
        {error && <p className="text-pranko-pink text-sm mt-4">{error}</p>}
        {checkoutId && <p className="text-pranko-muted text-[10px] mt-6 break-all opacity-40">checkout {checkoutId}</p>}
      </motion.div>
    </div>
  );
}