"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Gamepad2 } from "lucide-react";

const FAL_KEY = "a923b799-93e9-4821-bffd-f2d060148c60:c6383e0a9117462997c63fa43ef92c4a";
const FAL_BASE = "https://queue.fal.run";
const FAL_MODEL = "fal-ai/seedance-2/mini/reference-to-video";

/**
 * Recursively search an object for any video URL.
 * Same logic as the server-side version in /api/status/route.ts.
 */
function findVideoUrl(obj: any, depth = 0): string | null {
  if (!obj || depth > 15 || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findVideoUrl(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.length > 10) {
      const isUrl = value.startsWith("https://") || value.startsWith("http://");
      if (!isUrl) continue;
      // video file extensions
      if (/\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(value)) return value;
      // key named 'url' — most common fal.ai response shape: { video: { url: "..." } }
      if (key.toLowerCase() === "url") return value;
      // known fal.ai delivery domains
      if (/fal\.(ai|run)|falcdn\.com|storage\.googleapis\.com|delivery\.fal/i.test(value)) return value;
      // /v1/files/ or /files/ patterns
      if (/\/v\d\/files\/|\/files\//i.test(value)) return value;
    }
    if (typeof value === "object" && value !== null) {
      const found = findVideoUrl(value, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

/** Fetch text safely. */
async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { Authorization: `Key ${FAL_KEY}` } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export default function GeneratingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-pranko-lime text-4xl animate-pulse">🧌</div></div>}>
      <GeneratingPageInner />
    </Suspense>
  );
}

function GeneratingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("generating");
  const jobId = searchParams.get("job");
  const falId = searchParams.get("fal");
  const prefix = locale === "en" ? "" : `/${locale}`;

  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const resolvedRef = useRef(false);

  const steps = [t("steps.1"), t("steps.2"), t("steps.3")];

  // Animate step indicator
  useEffect(() => {
    const iv = setInterval(() => setCurrentStep(s => (s + 1) % steps.length), 3000);
    return () => clearInterval(iv);
  }, [steps.length]);

  // Tick elapsed timer
  useEffect(() => {
    const iv = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  // Poll fal.ai DIRECTLY from the browser
  useEffect(() => {
    if (!falId || resolvedRef.current) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 120; // 6 minutes max

    async function poll() {
      if (cancelled || resolvedRef.current) return;
      attempts++;
      if (attempts > maxAttempts) {
        setError("Generation took too long. Please try again.");
        return;
      }

      try {
        // 1. Check status
        const statusText = await fetchText(`${FAL_BASE}/${FAL_MODEL}/requests/${falId}/status`);
        let statusData: any;
        try { statusData = JSON.parse(statusText); } catch { schedule(); return; }

        const status = statusData.status;

        if (status === "COMPLETED") {
          // 2. Fetch result
          const resultText = await fetchText(`${FAL_BASE}/${FAL_MODEL}/requests/${falId}`);
          let resultData: any;
          try { resultData = JSON.parse(resultText); } catch { schedule(); return; }

          console.log("[generating] fal result keys:", Object.keys(resultData));

          // Search for video URL using the FIXED findVideoUrl
          const videoUrl = findVideoUrl(resultData);

          if (videoUrl) {
            resolvedRef.current = true;

            // Persist the result to Supabase via our new API
            if (jobId) {
              try {
                await fetch("/api/job-complete", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ jobId, videoUrl }),
                });
              } catch (e) {
                console.warn("[generating] Failed to persist job result:", e);
              }
            }

            router.push(`${prefix}/result/view?video=${encodeURIComponent(videoUrl)}`);
            return;
          }

          // If we got COMPLETED but no video URL, dump the full response
          console.error("[generating] COMPLETED but no video URL. Full response:", JSON.stringify(resultData).substring(0, 2000));
          setError("Video generated but URL could not be found. Check browser console (F12 → Console) and send us the output.");
          return;
        }

        if (status === "FAILED" || status === "ERROR") {
          setError("Generation failed on fal.ai. Please try again.");
          return;
        }

        // Still in progress
      } catch (e: any) {
        console.warn("[generating] poll error:", e.message);
      }
      schedule();
    }

    function schedule() {
      if (!cancelled) setTimeout(poll, 3000);
    }

    // Start first poll after 2 seconds
    const initialDelay = setTimeout(poll, 2000);

    return () => {
      cancelled = true;
      clearTimeout(initialDelay);
    };
  }, [falId, jobId, router, prefix]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card-pranko p-8 max-w-md text-center">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-display text-2xl text-white mb-2">{t("error")}</h2>
          <p className="text-pranko-muted mb-6 text-sm break-all">{error}</p>
          <button onClick={() => router.push(`${prefix}/create`)} className="btn-pranko w-full">Try again</button>
        </div>
      </div>
    );
  }

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <div className="text-8xl sm:text-9xl mb-6 animate-float-slow">🧌</div>

        <h1 className="text-display text-3xl sm:text-4xl text-white mb-2">{t("title")}</h1>
        <p className="text-pranko-muted mb-8">{t("subtitle")}</p>

        <div className="card-pranko p-6 text-left space-y-3">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 transition-opacity ${i <= currentStep ? "opacity-100" : "opacity-30"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i < currentStep ? "bg-pranko-lime text-pranko-bg" :
                i === currentStep ? "bg-pranko-pink text-white animate-pulse" :
                "bg-pranko-border text-pranko-muted"
              }`}>
                {i < currentStep ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${i === currentStep ? "text-white font-semibold" : "text-pranko-muted"}`}>{s}</span>
            </div>
          ))}
        </div>

        <p className="text-pranko-muted text-xs mt-3">Elapsed: {timeStr} · Don't refresh</p>
        <p className="text-pranko-muted text-[10px] mt-1 opacity-50">Polling fal.ai directly from browser</p>
      </div>
    </div>
  );
}