"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Download, Share2, RotateCw, Sparkles, Heart, Check } from "lucide-react";
import Link from "next/link";

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("result");
  const shareToken = params.shareToken as string;
  const [job, setJob] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const prefix = locale === "en" ? "" : `/${locale}`;

  useEffect(() => {
    fetch(`/api/share/${shareToken}`)
      .then((r) => r.json())
      .then(setJob)
      .catch(() => {});
  }, [shareToken]);

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-pranko-lime text-6xl animate-pulse">🧌</div>
      </div>
    );
  }

  const isFree = job.tier === "free";
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${prefix}/result/${shareToken}` : "";

  function downloadImage() {
    if (!job?.resultImageUrl) return;
    const link = document.createElement("a");
    link.href = job.resultImageUrl;
    link.download = `pranko-${shareToken}.png`;
    link.target = "_blank";
    link.click();
  }

  async function shareToTikTok() {
    if (!job?.resultImageUrl) return;
    const caption = t("caption") + "\n\n" + shareUrl;
    if (navigator.share) {
      try {
        await navigator.share({ title: "I made this on Pranko", text: caption, url: shareUrl });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(caption);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    window.open("https://www.tiktok.com/upload", "_blank");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="text-5xl mb-2">🎉</div>
          <h1 className="text-display text-3xl sm:text-4xl text-white mb-2">{t("title")}</h1>
          <p className="text-pranko-muted">{t("subtitle")}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="card-pranko overflow-hidden mb-6">
          <div className="relative aspect-[4/3] bg-pranko-card">
            {job.resultImageUrl ? (
              <img src={job.resultImageUrl} alt="Your prank" className="w-full h-full object-contain" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-pranko-muted">Loading…</div>
            )}
            {isFree && (
              <div className="absolute bottom-0 left-0 right-0 bg-pranko-lime text-pranko-bg text-center text-xs font-bold py-1.5">
                {t("watermark")}
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={downloadImage} className="btn-pranko !text-base !py-4">
            <Download size={18} /> {t("download")}
          </button>
          <button onClick={shareToTikTok} className="btn-pranko-pink !text-base !py-4">
            <Share2 size={18} /> {t("shareTiktok")}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <button onClick={copyLink} className="btn-pranko-ghost !text-sm !py-3">
            {copied ? <><Check size={16} /> Copied!</> : t("copyLink")}
          </button>
          <Link href={`${prefix}/create`} className="btn-pranko-ghost !text-sm !py-3 text-center">
            <RotateCw size={16} /> {t("newPrank")}
          </Link>
        </div>

        {!isFree && (
          <div className="card-pranko p-4 mt-6 text-center border-pranko-lime/30">
            <Heart className="inline text-pranko-pink mb-1" size={20} />
            <p className="text-pranko-muted text-sm">Love Pranko? Share your prank on TikTok and tag <span className="text-pranko-lime font-semibold">@pranko</span> to get featured 🚀</p>
          </div>
        )}
      </div>
    </div>
  );
}
