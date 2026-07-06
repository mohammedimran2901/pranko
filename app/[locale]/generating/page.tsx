"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

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

  // Poll our own /api/status (same-origin, no CORS issues on mobile)
  useEffect(() => {
    if (!jobId || resolvedRef.current) return;

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
        const res = await fetch(`/api/status?id=${encodeURIComponent(jobId!)}&fal=${encodeURIComponent(falId || "")}`);
        if (!res.ok) { schedule(); return; }

        const data = await res.json();

        if (data.status === "completed" && data.resultVideoUrl) {
          resolvedRef.current = true;
          router.push(`${prefix}/result/view?video=${encodeURIComponent(data.resultVideoUrl)}`);
          return;
        }

        if (data.status === "failed") {
          setError(data.error || "Generation failed. Please try again.");
          return;
        }

        // still generating
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
  }, [jobId, falId, router, prefix]);

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
        <p className="text-pranko-muted mb-8">This can take 2–3 minutes</p>

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
      </div>
    </div>
  );
}