"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-pranko-lime text-4xl animate-pulse">🧌</div></div>}>
      <SuccessPageInner />
    </Suspense>
  );
}

function SuccessPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("result");
  const credits = parseInt(searchParams.get("credits") || "6", 10);

  useEffect(() => {
    localStorage.setItem("pranko_credits", String(credits));
  }, [credits]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
        <div className="text-7xl mb-4">🎉</div>
        <h1 className="text-display text-3xl sm:text-4xl text-white mb-4">
          {credits} Credits Added!
        </h1>
        <p className="text-pranko-muted mb-8">
          Each video costs 1 credit. Credits refresh every week with your subscription.
        </p>
        <button onClick={() => router.push("/en/create")} className="btn-pranko !text-lg !px-10 !py-5 glow-lime">
          <Sparkles size={20} /> Make my first prank
        </button>
      </motion.div>
    </div>
  );
}