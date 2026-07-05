"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Sparkles, X, Loader2, CreditCard, Coins } from "lucide-react";

const STORAGE_KEY = "pranko_draft";

interface DraftData {
  image: string;
  prompt: string;
}

function saveDraft(data: DraftData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftData;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-pranko-lime text-4xl animate-pulse">🧌</div>
        </div>
      }
    >
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
  const [credits, setCredits] = useState<number | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Restore saved draft from localStorage (survives payment redirect).
  useEffect(() => {
    const draft = loadDraft();
    if (draft?.image) setImage(draft.image);
    if (draft?.prompt) setPrompt(draft.prompt);
  }, []);

  // Pull the live credit balance from the server.
  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => setCredits(d.credits ?? 0))
      .catch(() => setCredits(0));
  }, []);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Max 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      setImage(dataUri);
      saveDraft({ image: dataUri, prompt });
    };
    reader.readAsDataURL(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handlePromptChange(value: string) {
    setPrompt(value);
    saveDraft({ image: image || "", prompt: value });
  }

  function handleRemoveImage() {
    setImage(null);
    saveDraft({ image: "", prompt });
  }

  // Redirect to checkout, saving the draft so the user doesn't lose their work.
  function redirectToCheckout(url: string) {
    if (image && prompt.trim()) {
      saveDraft({ image, prompt: prompt.trim() });
    }
    window.location.href = url;
  }

  async function startCheckout(type: "single" | "weekly" = "weekly") {
    setCheckoutLoading(type);
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
        redirectToCheckout(url);
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (e: any) {
      alert(e.message || "Checkout failed");
    } finally {
      setCheckoutLoading(null);
    }
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

      if (res.status === 402) {
        const data = await res.json().catch(() => ({}));
        setGenerating(false);
        setCredits(0);
        // Save draft before redirecting to checkout.
        if (data.checkoutUrl) {
          redirectToCheckout(data.checkoutUrl);
          return;
        }
        await startCheckout();
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        let msg = `Server error (${res.status})`;
        try {
          const err = JSON.parse(text);
          msg = err.error || msg;
        } catch {}
        throw new Error(msg);
      }

      // Clear the draft now that generation has started successfully.
      clearDraft();

      const data = await res.json().catch(() => ({})) as any;
      if (typeof data.creditsRemaining === "number") {
        setCredits(data.creditsRemaining);
      }
      const falParam = data.falRequestId
        ? `&fal=${data.falRequestId}`
        : "";
      router.push(
        `${prefix}/generating?job=${data.jobId}${falParam}`
      );
    } catch (e: any) {
      alert(e.message || "Something went wrong");
      setGenerating(false);
    }
  }

  const hasCredits = (credits ?? 0) > 0;

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header + credit badge */}
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-display text-3xl sm:text-4xl text-white">
              🎬 {t("title")}
            </h1>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                hasCredits
                  ? "bg-pranko-lime/20 text-pranko-lime"
                  : "bg-pranko-pink/20 text-pranko-pink"
              }`}
              title="Credits remaining"
            >
              <Coins size={14} />
              {credits === null ? "…" : credits}
            </div>
          </div>
          <p className="text-pranko-muted text-center mb-8">
            {t("subtitle")}
          </p>

          {/* No-credits banner */}
          {credits !== null && credits <= 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-pranko p-5 mb-6 border-2 border-pranko-lime/40"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">💳</div>
                <div className="flex-1">
                  <p className="font-display font-bold text-white text-lg mb-1">
                    Get credits to generate prank videos
                  </p>
                  <p className="text-pranko-muted text-sm mb-3">
                    Your photo and prompt will be saved while you pay.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => startCheckout("single")}
                      disabled={checkoutLoading !== null}
                      className="btn-pranko !text-sm !py-2.5 !px-5 glow-lime inline-flex"
                    >
                      {checkoutLoading === "single" ? (
                        <><Loader2 className="animate-spin" size={16} /> Opening…</>
                      ) : (
                        <><CreditCard size={16} /> 1 video — $1.99</>
                      )}
                    </button>
                    <button
                      onClick={() => startCheckout("weekly")}
                      disabled={checkoutLoading !== null}
                      className="btn-pranko-pink !text-sm !py-2.5 !px-5 glow-pink inline-flex"
                    >
                      {checkoutLoading === "weekly" ? (
                        <><Loader2 className="animate-spin" size={16} /> Opening…</>
                      ) : (
                        <><CreditCard size={16} /> 6 videos/week — $4.99</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Draft restore banner */}
          {!image && loadDraft()?.image && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-pranko p-4 mb-4 border border-pranko-lime/30 text-center"
            >
              <p className="text-pranko-muted text-sm">
                We restored your photo and prompt from before your payment. Keep
                going!
              </p>
              <button
                onClick={() => {
                  const d = loadDraft();
                  if (d?.image) {
                    setImage(d.image);
                    setPrompt(d.prompt || "");
                  }
                }}
                className="text-pranko-lime text-sm font-semibold underline mt-1"
              >
                Restore my draft
              </button>
            </motion.div>
          )}

          {/* Upload area */}
          {!image ? (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="card-pranko border-dashed border-4 border-pranko-border hover:border-pranko-lime/50 p-12 text-center cursor-pointer transition-colors"
            >
              <div className="text-6xl mb-3">📸</div>
              <p className="font-display font-bold text-lg text-white mb-1">
                {t("uploadButton")}
              </p>
              <p className="text-pranko-muted text-sm">{t("uploadTip")}</p>
            </div>
          ) : (
            <div className="card-pranko p-4">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-pranko-bg">
                <img
                  src={image}
                  alt="Your image"
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={handleRemoveImage}
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
            onChange={(e) =>
              e.target.files?.[0] && handleFile(e.target.files[0])
            }
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
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder={t("promptPlaceholder") as string}
                rows={3}
                maxLength={1000}
                className="w-full bg-pranko-bg border-2 border-pranko-border rounded-xl p-3 text-white placeholder-pranko-muted focus:border-pranko-lime focus:outline-none resize-none"
              />
              <p className="text-pranko-muted text-xs mt-1 text-right">
                {prompt.length}/1000
              </p>

              {hasCredits ? (
                <button
                  onClick={generateVideo}
                  disabled={!prompt.trim() || generating}
                  className="btn-pranko w-full !text-lg !py-5 mt-4 glow-lime"
                >
                  {generating ? (
                    <>
                      <Loader2 className="animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      {t("generateButton")} <Sparkles size={18} />
                    </>
                  )}
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    onClick={() => startCheckout("single")}
                    disabled={checkoutLoading !== null}
                    className="btn-pranko flex-1 !text-base !py-4 glow-lime"
                  >
                    {checkoutLoading === "single" ? (
                      <><Loader2 className="animate-spin" size={16} /> Opening…</>
                    ) : (
                      <><CreditCard size={16} /> 1 video — $1.99</>
                    )}
                  </button>
                  <button
                    onClick={() => startCheckout("weekly")}
                    disabled={checkoutLoading !== null}
                    className="btn-pranko-pink flex-1 !text-base !py-4 glow-pink"
                  >
                    {checkoutLoading === "weekly" ? (
                      <><Loader2 className="animate-spin" size={16} /> Opening…</>
                    ) : (
                      <><CreditCard size={16} /> 6 videos/week — $4.99</>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}