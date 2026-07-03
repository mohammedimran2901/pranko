"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Sparkles, X, Loader2 } from "lucide-react";

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-pranko-lime text-4xl animate-pulse">🧌</div></div>}>
      <CreatePageInner />
    </Suspense>
  );
}

function CreatePageInner() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("create");
  const prefix = locale === "en" ? "" : `/${locale}`;

  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Max 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function generateVideo() {
    if (!image || !prompt.trim()) return;
    setGenerating(true);

    try {
      const res = await fetch("/api/create-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, prompt: prompt.trim(), locale }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create job");
      }

      const data = await res.json();
      const falParam = data.falRequestId ? `&fal=${data.falRequestId}` : "";
      router.push(`${prefix}/generating?job=${data.jobId}${falParam}`);
    } catch (e: any) {
      alert(e.message || "Something went wrong");
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-display text-3xl sm:text-4xl text-center mb-2 text-white">
            🎬 {t("title")}
          </h1>
          <p className="text-pranko-muted text-center mb-8">{t("subtitle")}</p>

          {/* Upload area */}
          {!image ? (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="card-pranko border-dashed border-4 border-pranko-border hover:border-pranko-lime/50 p-12 text-center cursor-pointer transition-colors"
            >
              <div className="text-6xl mb-3">📸</div>
              <p className="font-display font-bold text-lg text-white mb-1">{t("uploadButton")}</p>
              <p className="text-pranko-muted text-sm">{t("uploadTip")}</p>
            </div>
          ) : (
            <div className="card-pranko p-4">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-pranko-bg">
                <img src={image} alt="Your image" className="w-full h-full object-contain" />
                <button
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 p-1.5 bg-pranko-bg/80 backdrop-blur rounded-full text-white hover:text-pranko-lime"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {/* Prompt input */}
          {image && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <label className="block text-sm font-semibold text-white mb-2">
                {t("promptLabel")}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("promptPlaceholder") as string}
                rows={3}
                maxLength={1000}
                className="w-full bg-pranko-bg border-2 border-pranko-border rounded-xl p-3 text-white placeholder-pranko-muted focus:border-pranko-lime focus:outline-none resize-none"
              />
              <p className="text-pranko-muted text-xs mt-1 text-right">{prompt.length}/1000</p>

              <button
                onClick={generateVideo}
                disabled={!prompt.trim() || generating}
                className="btn-pranko w-full !text-lg !py-5 mt-4 glow-lime"
              >
                {generating ? (
                  <><Loader2 className="animate-spin" /> Generating...</>
                ) : (
                  <>{t("generateButton")} <Sparkles size={18} /></>
                )}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}