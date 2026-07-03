"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Download, Share2, RotateCw, Check } from "lucide-react";
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

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${prefix}/result/${shareToken}` : "";

  function downloadVideo() {
    if (!job?.resultVideoUrl) return;
    const link = document.createElement("a");
    link.href = job.resultVideoUrl;
    link.download = `pranko-${shareToken}.mp4`;
    link.target = "_blank";
    link.click();
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
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="text-5xl mb-2">🎉</div>
          <h1 className="text-display text-3xl sm:text-4xl text-white mb-2">{t("title")}</h1>
          <p className="text-pranko-muted">{t("subtitle")}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="card-pranko overflow-hidden mb-6">
          <div className="relative aspect-[9/16] bg-pranko-card max-h-[70vh]">
            {job.resultVideoUrl ? (
              <video
                src={job.resultVideoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-pranko-muted">Loading…</div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={downloadVideo} className="btn-pranko !text-base !py-4">
            <Download size={18} /> {t("download")}
          </button>
          <button onClick={copyLink} className="btn-pranko-ghost !text-sm !py-3">
            {copied ? <><Check size={16} /> Copied!</> : t("copyLink")}
          </button>
        </div>

        <div className="mt-3">
          <Link href={`${prefix}/create`} className="btn-pranko-ghost !text-sm !py-3 text-center block w-full">
            <RotateCw size={16} /> {t("newPrank")}
          </Link>
        </div>
      </div>
    </div>
  );
}