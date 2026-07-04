"use client";

import { useEffect, Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Sparkles, Loader2, ArrowRight, Coins } from "lucide-react";

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

  // Polar appends `checkout_id` to our success URL.
  const checkoutId = searchParams.get("checkout_id");
  const sessionId = searchParams.get("session_id"); // legacy / fallback

  const [credits, setCredits] = useState<number | null>(null);
  const [pollAttempts, setPollAttempts] = useState(0);

  // Poll the credits endpoint until the webhook grants 6 credits.
  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch("/api/credits", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setCredits(data.credits ?? 0);
        if ((data.credits ?? 0) > 0) return; // done
        if (pollAttempts < 10) {
          setPollAttempts((n) => n + 1);
          setTimeout(tick, 1500);
        }
      } catch {}
    }
    tick();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="text-7xl mb-4">🎉</div>
        <h1 className="text-display text-3xl sm:text-4xl text-white mb-4">
          {t("subscriptionActive")}
        </h1>

        {/* Credit count badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pranko-lime/20 text-pranko-lime font-display font-bold text-lg mb-4">
          <Coins size={18} />
          {credits === null ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="animate-spin" size={16} /> …
            </span>
          ) : (
            <>{credits} credits ready</>
          )}
        </div>

        <p className="text-pranko-muted mb-2">
          {t("subscriptionDesc")}
        </p>
        <p className="text-pranko-muted text-xs mb-8">
          {t("subscriptionRenew")}
        </p>

        <button
          onClick={() => router.push(`${prefix}/create`)}
          className="btn-pranko !text-lg !px-10 !py-5 glow-lime w-full"
        >
          <Sparkles size={20} /> {t("makeFirstPrank")} <ArrowRight size={18} />
        </button>

        {checkoutId && (
          <p className="text-pranko-muted text-[10px] mt-6 break-all">
            Polar checkout {checkoutId}
          </p>
        )}
        {!checkoutId && sessionId && (
          <p className="text-pranko-muted text-[10px] mt-6 break-all">
            Session {sessionId}
          </p>
        )}
      </motion.div>
    </div>
  );
}
