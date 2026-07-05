"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Download, RotateCw, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

/**
 * The video result page. Because we now charge the user BEFORE we run
 * generation (via /api/create-job), this page is just a player — the
 * video plays as soon as it arrives. There is no post-generation paywall.
 *
 * If the user lands here without a job id (e.g. from a stale link), we
 * send them back to /create.
 */
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
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => setCredits(d.credits ?? 0))
      .catch(() => setCredits(0));
  }, []);

  function downloadVideo() {
    if (!videoUrl) return;
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = `pranko.mp4`;
    link.target = "_blank";
    link.click();
  }

  if (!videoUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card-pranko p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🤔</div>
          <h2 className="text-display text-2xl text-white mb-2">No video yet</h2>
          <p className="text-pranko-muted mb-6">
            We couldn't find your prank. Try creating a new one.
          </p>
          <Link href={`${prefix}/create`} className="btn-pranko w-full">
            Make a prank
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="text-5xl mb-2">🎉</div>
          <h1 className="text-display text-3xl sm:text-4xl text-white mb-2">
            {t("title")}
          </h1>
          <p className="text-pranko-muted">{t("subtitle")}</p>
          {credits !== null && credits > 0 && (
            <p className="text-pranko-lime text-sm mt-1 inline-flex items-center gap-1">
              <Sparkles size={14} /> {credits} {credits === 1 ? "credit" : "credits"} remaining
            </p>
          )}
          {credits === 0 && (
            <Link
              href={`${prefix}/create`}
              className="text-pranko-pink text-sm mt-1 inline-flex items-center gap-1"
            >
              <AlertCircle size={14} /> No credits left — subscribe to make more
            </Link>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card-pranko overflow-hidden mb-6"
        >
          <div className="relative aspect-[9/16] bg-pranko-card max-h-[70vh]">
            <video
              src={videoUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button onClick={downloadVideo} className="btn-pranko !text-base !py-4">
            <Download size={18} /> {t("download")}
          </button>
          <Link
            href={`${prefix}/create`}
            className="btn-pranko-ghost !text-sm !py-3 text-center"
          >
            <RotateCw size={16} /> {t("newPrank")}
          </Link>
        </div>

        {/* TikTok / Sharing tips */}
        <div className="card-pranko p-4 border border-pranko-border/50">
          <h3 className="text-white font-display font-bold text-sm mb-2">📱 Ready for TikTok</h3>
          <ul className="text-pranko-muted text-xs space-y-1.5">
            <li>• This video is optimized for TikTok (9:16 vertical)</li>
            <li>• <strong>On mobile:</strong> tap and hold the video → Save to Photos</li>
            <li>• <strong>On desktop:</strong> right-click the video → Save video as…</li>
            <li>• Or click <strong>Download</strong> above to save as pranko.mp4</li>
            <li>• Then open TikTok, tap +, upload your saved video</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
