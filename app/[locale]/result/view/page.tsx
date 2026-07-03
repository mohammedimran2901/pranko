"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Download, RotateCw, Lock, Sparkles, CreditCard } from "lucide-react";
import Link from "next/link";

export default function ResultViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-pranko-lime text-6xl animate-pulse">🧌</div></div>}>
      <ResultViewPageInner />
    </Suspense>
  );
}

function ResultViewPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("result");
  const prefix = locale === "en" ? "" : `/${locale}`;

  const videoUrl = searchParams.get("video");
  const [unlocked, setUnlocked] = useState(false);
  const [credits, setCredits] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pranko_credits");
    if (saved) {
      const c = parseInt(saved, 10);
      if (c > 0) {
        setCredits(c);
        setUnlocked(true);
      }
    }
  }, []);

  function useCredit() {
    if (credits <= 0) return;
    const newCredits = credits - 1;
    localStorage.setItem("pranko_credits", String(newCredits));
    setCredits(newCredits);
    setUnlocked(true);
  }

  async function handleBuyCredits() {
    setProcessing(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "weekly" }),
      });
      if (!res.ok) throw new Error("Failed to create checkout");

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessing(false);
    }
  }

  function downloadVideo() {
    if (!videoUrl) return;
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = `pranko.mp4`;
    link.target = "_blank";
    link.click();
  }

  // PAYWALL
  if (!unlocked || credits <= 0) {
    return (
      <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-display text-3xl sm:text-4xl text-white mb-4">
              Your video is ready!
            </h1>
            <p className="text-pranko-muted mb-8">
              Unlock with credits or subscribe for unlimited pranks.
            </p>

            {credits > 0 ? (
              <button onClick={useCredit} className="btn-pranko !text-xl !px-10 !py-5 glow-lime w-full">
                <Sparkles size={20} /> Use 1 Credit ({credits} left)
              </button>
            ) : (
              <>
                <div className="card-pranko p-6 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-display font-bold text-lg">Weekly</span>
                    <span className="text-pranko-lime font-display font-bold text-2xl">$5.99</span>
                  </div>
                  <p className="text-pranko-muted text-sm text-left mb-4">
                    6 credits per week · Cancel anytime · Priority generation
                  </p>
                  <button
                    onClick={handleBuyCredits}
                    disabled={processing}
                    className="btn-pranko-pink !text-lg !px-8 !py-4 w-full glow-pink"
                  >
                    {processing ? "Processing..." : (
                      <><CreditCard size={18} /> Subscribe for $5.99/week</>
                    )}
                  </button>
                </div>
                <Link href={`${prefix}/create`} className="btn-pranko-ghost !text-sm block w-full text-center">
                  <RotateCw size={16} /> Make another prank
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // UNLOCKED - Show video
  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="text-5xl mb-2">🎉</div>
          <h1 className="text-display text-3xl sm:text-4xl text-white mb-2">{t("title")}</h1>
          <p className="text-pranko-muted">{t("subtitle")}</p>
          <p className="text-pranko-lime text-sm mt-1">{credits} credits remaining</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="card-pranko overflow-hidden mb-6">
          <div className="relative aspect-[9/16] bg-pranko-card max-h-[70vh]">
            {videoUrl ? (
              <video src={videoUrl} controls autoPlay playsInline className="w-full h-full object-contain" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-pranko-muted">Loading…</div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={downloadVideo} className="btn-pranko !text-base !py-4">
            <Download size={18} /> {t("download")}
          </button>
          <Link href={`${prefix}/create`} className="btn-pranko-ghost !text-sm !py-3 text-center">
            <RotateCw size={16} /> {t("newPrank")}
          </Link>
        </div>
      </div>
    </div>
  );
}