"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, X, Loader2, ArrowRight, Flame, Star } from "lucide-react";
import { TEMPLATES, MODES, type Mode, getTemplateById, getTemplatesByMode } from "@/lib/templates";
import { TEMPLATE_TRANSLATIONS } from "@/lib/template-i18n";

type Tier = "free" | "single" | "pack" | "pro" | "lifetime";

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
  const searchParams = useSearchParams();
  const t = useTranslations("create");
  const tModes = useTranslations("modes");
  const tTemplates = useTranslations("templates");
  const tCommon = useTranslations("common");

  const tKey = (k: string) =>
    (TEMPLATE_TRANSLATIONS as any)[locale]?.[k] ??
    (TEMPLATE_TRANSLATIONS as any)["en"]?.[k] ??
    k;

  const prefix = locale === "en" ? "" : `/${locale}`;

  const initialMode = (searchParams.get("mode") as Mode) || "ex";
  const initialTier = (searchParams.get("tier") as Tier) || "free";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier>(initialTier);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStep(image ? 2 : 1);
  }, [image]);

  function pickTemplate(id: string) {
    setSelectedTemplate(id);
    setMode(getTemplateById(id)?.mode || mode);
    setTimeout(() => {
      fileRef.current?.click();
    }, 200);
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Max 10MB");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function generate() {
    if (!image) return;
    if (mode === "custom" && !customPrompt.trim()) return;
    setUploading(true);
    try {
      const template = selectedTemplate ? getTemplateById(selectedTemplate) : null;
      const prompt = mode === "custom" ? customPrompt : (template?.prompt || customPrompt);

      const res = await fetch("/api/create-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          prompt,
          templateId: selectedTemplate,
          mode,
          locale,
          tier,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create job");
      }

      const data = await res.json();
      router.push(`${prefix}/generating?job=${data.jobId}&tier=${tier}`);
    } catch (e: any) {
      alert(e.message || "Something went wrong");
      setUploading(false);
    }
  }

  const templatesForMode = mode === "custom" ? [] : getTemplatesByMode(mode);
  const ready = image && (mode === "custom" ? customPrompt.trim() : selectedTemplate);

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                step >= s ? "w-12 bg-pranko-lime" : "w-6 bg-pranko-border"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Mode + Template + Upload */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h1 className="text-display text-3xl sm:text-4xl text-center mb-2 text-white">
                🎭 {t("title")}
              </h1>
              <p className="text-pranko-muted text-center mb-8">{t("step1")} → {t("step2")} → {t("step3")} → {t("step4")}</p>

              {/* Mode tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMode(m.id);
                      setSelectedTemplate(null);
                    }}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-display font-bold border-2 transition-all ${
                      mode === m.id
                        ? "bg-pranko-lime text-pranko-bg border-pranko-lime"
                        : "border-pranko-border text-pranko-muted hover:border-pranko-lime/50"
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{tModes(`${m.id}.name`)}</span>
                  </button>
                ))}
              </div>

              {/* Template gallery OR custom prompt */}
              {mode === "custom" ? (
                <div className="card-pranko p-5">
                  <label className="block text-sm font-semibold text-white mb-2">
                    {t("customTitle")}
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={t("customPlaceholder") as string}
                    rows={3}
                    className="w-full bg-pranko-bg border-2 border-pranko-border rounded-xl p-3 text-white placeholder-pranko-muted focus:border-pranko-lime focus:outline-none resize-none"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templatesForMode.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => pickTemplate(tpl.id)}
                      className={`card-pranko p-4 text-left transition-all hover:scale-[1.02] ${
                        selectedTemplate === tpl.id ? "border-pranko-lime ring-2 ring-pranko-lime/40" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl flex-shrink-0">{tpl.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-display font-bold text-sm text-white truncate">
                              {tKey(tpl.titleKey)}
                            </h3>
                            {tpl.trending && <Flame size={12} className="text-pranko-orange flex-shrink-0" />}
                            {tpl.isNew && <Star size={12} className="text-pranko-yellow flex-shrink-0" />}
                          </div>
                          <p className="text-pranko-muted text-xs mt-0.5 line-clamp-2">{tKey(tpl.descKey)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Upload + Generate */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h1 className="text-display text-3xl sm:text-4xl text-center mb-2 text-white">
                📸 {t("uploadTitle")}
              </h1>
              <p className="text-pranko-muted text-center mb-8">{t("uploadSub")}</p>

              {!image ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  className="card-pranko border-dashed border-4 border-pranko-border hover:border-pranko-lime/50 p-12 text-center cursor-pointer transition-colors"
                >
                  <div className="text-6xl mb-3">📷</div>
                  <p className="font-display font-bold text-lg text-white mb-1">{t("uploadButton")}</p>
                  <p className="text-pranko-muted text-sm">{t("uploadTip")}</p>
                </div>
              ) : (
                <div className="card-pranko p-4">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-pranko-bg">
                    <img src={image} alt="Your selfie" className="w-full h-full object-contain" />
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

              {/* Tier selector */}
              {image && (
                <div className="mt-6">
                  <p className="text-sm text-pranko-muted text-center mb-2">Choose your prank tier</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["free", "single", "pack"] as Tier[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTier(t)}
                        className={`p-3 rounded-xl text-center border-2 transition-all ${
                          tier === t ? "border-pranko-lime bg-pranko-lime/10" : "border-pranko-border"
                        }`}
                      >
                        <div className="text-xs uppercase text-pranko-muted">{t === "free" ? "Free" : t === "single" ? "1 prank" : "5-pack"}</div>
                        <div className="font-display font-bold text-pranko-lime">{t === "free" ? "$0" : t === "single" ? "$2.99" : "$7.99"}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {image && (
                <button
                  onClick={generate}
                  disabled={!ready || uploading}
                  className="btn-pranko w-full !text-lg !py-5 mt-6 glow-lime"
                >
                  {uploading ? (
                    <><Loader2 className="animate-spin" /> {tCommon("loading")}</>
                  ) : (
                    <>{t("generateButton")} <ArrowRight /></>
                  )}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
