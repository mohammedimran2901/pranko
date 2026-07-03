"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function GeneratingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("generating");
  const jobId = searchParams.get("job");
  const tier = searchParams.get("tier") || "free";
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const prefix = locale === "en" ? "" : `/${locale}`;

  const steps = [t("steps.1"), t("steps.2"), t("steps.3"), t("steps.4")];

  useEffect(() => {
    if (!jobId) {
      router.push(`${prefix}/create`);
      return;
    }

    // Cycle through steps visually
    const interval = setInterval(() => {
      setCurrentStep((s) => (s + 1) % steps.length);
    }, 2500);

    // Poll for job status
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/status?id=${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "completed" && data.shareToken) {
          clearInterval(poll);
          clearInterval(interval);
          router.push(`${prefix}/result/${data.shareToken}`);
        } else if (data.status === "failed") {
          clearInterval(poll);
          clearInterval(interval);
          setError(data.error || "Generation failed");
        }
      } catch (e) {
        // network blip, keep polling
      }
    }, 2500);

    return () => {
      clearInterval(poll);
      clearInterval(interval);
    };
  }, [jobId, router, prefix, steps.length]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card-pranko p-8 max-w-md text-center">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-display text-2xl text-white mb-2">Pranko tripped</h2>
          <p className="text-pranko-muted mb-6">{error}</p>
          <button onClick={() => router.push(`${prefix}/create`)} className="btn-pranko w-full">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        {/* Animated goblin */}
        <div className="text-8xl sm:text-9xl mb-6 animate-float-slow">🧌</div>

        <h1 className="text-display text-3xl sm:text-4xl text-white mb-2">{t("title")}</h1>
        <p className="text-pranko-muted mb-8">{t("subtitle")}</p>

        {/* Progress steps */}
        <div className="card-pranko p-6 text-left space-y-3">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 transition-opacity ${
                i <= currentStep ? "opacity-100" : "opacity-30"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < currentStep
                    ? "bg-pranko-lime text-pranko-bg"
                    : i === currentStep
                    ? "bg-pranko-pink text-white animate-pulse"
                    : "bg-pranko-border text-pranko-muted"
                }`}
              >
                {i < currentStep ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${i === currentStep ? "text-white font-semibold" : "text-pranko-muted"}`}>
                {s}
              </span>
            </div>
          ))}
        </div>

        <p className="text-pranko-muted text-xs mt-6">~10 seconds · Don't refresh</p>
      </div>
    </div>
  );
}
