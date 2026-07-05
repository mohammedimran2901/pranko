"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Shield, Trash2, Smartphone, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";

const ICONS: Record<number, React.ReactNode> = {
  0: <Shield size={18} className="text-pranko-lime" />,
  1: <Trash2 size={18} className="text-pranko-lime" />,
  2: <Smartphone size={18} className="text-pranko-lime" />,
  3: <CreditCard size={18} className="text-pranko-lime" />,
};

export function Faq() {
  const t = useTranslations("faq");
  const questions = [0, 1, 2, 3];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-display text-3xl sm:text-4xl text-white text-center mb-2">
          {t("title")}
        </h2>
        <p className="text-pranko-muted text-center mb-10 text-sm">
          {t("subtitle")}
        </p>

        <div className="space-y-3">
          {questions.map((i) => (
            <div
              key={i}
              className="card-pranko border border-pranko-border/50 overflow-hidden"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div className="shrink-0 mt-0.5">{ICONS[i]}</div>
                <span className="flex-1 font-semibold text-white text-sm">
                  {t(`q${i + 1}`)}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-pranko-muted"
                >
                  <ChevronDown size={18} />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-4 text-pranko-muted text-sm leading-relaxed">
                      {t(`a${i + 1}`)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}