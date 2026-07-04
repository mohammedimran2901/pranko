"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Sparkles, ArrowRight } from "lucide-react";
import { CASE_STUDIES, type CaseStudy } from "@/lib/case-studies";

/**
 * Real case studies — 5 before/after prank cards, one per scenario.
 * Hover (or click on mobile) to play the AI-generated "after" video.
 * If the MP4 hasn't been generated yet (before running
 * scripts/generate-case-studies.mjs), the gradient poster is shown instead.
 */
export function CaseStudies() {
  const t = useTranslations("caseStudies");
  const locale = useLocale();
  const prefix = locale === "en" ? "" : `/${locale}`;

  const [activeId, setActiveId] = useState<CaseStudy["id"] | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, el]) => {
      if (!el) return;
      if (id === activeId) {
        el.currentTime = 0;
        el.play().catch(() => {});
      } else {
        el.pause();
        try {
          el.currentTime = 0;
        } catch {}
      }
    });
  }, [activeId]);

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-pranko-surface/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-pranko-lime/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-pranko-pink/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pranko-lime/20 text-pranko-lime text-xs font-display font-bold mb-4">
            <Sparkles size={14} /> REAL OUTPUT · UNSPLASH + FAL.AI
          </div>
          <h2 className="text-display text-4xl sm:text-5xl text-white mb-3">
            {t("title")}
          </h2>
          <p className="text-pranko-muted text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Grid: 1 card on top (cs1 - the hero demo), then 2-col grid for the rest */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {CASE_STUDIES.map((cs, idx) => (
            <CaseStudyCard
              key={cs.id}
              study={cs}
              index={idx}
              isActive={activeId === cs.id}
              isHeroCard={cs.id === "cs1"}
              onActivate={() => setActiveId(cs.id)}
              onDeactivate={() => setActiveId(null)}
              registerVideo={(el) => {
                videoRefs.current[cs.id] = el;
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          className="text-center mt-12"
        >
          <Link
            href={`${prefix}/create`}
            className="btn-pranko-pink !text-lg !px-10 !py-5 glow-pink inline-flex"
          >
            {t("cta")} <ArrowRight size={20} />
          </Link>
          <p className="text-pranko-muted text-xs mt-3">{t("ctaSub")}</p>
        </motion.div>
      </div>
    </section>
  );
}

function CaseStudyCard({
  study,
  index,
  isActive,
  isHeroCard,
  onActivate,
  onDeactivate,
  registerVideo,
}: {
  study: CaseStudy;
  index: number;
  isActive: boolean;
  isHeroCard: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  registerVideo: (el: HTMLVideoElement | null) => void;
}) {
  const t = useTranslations(`caseStudies.${study.id}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onClick={isActive ? onDeactivate : onActivate}
      className={`card-pranko overflow-hidden cursor-pointer group relative ${
        isHeroCard ? "md:col-span-2" : ""
      }`}
    >
      {/* BEFORE / AFTER stage */}
      <div
        className={`relative ${
          isHeroCard ? "aspect-[21/9]" : "aspect-[16/10]"
        } bg-pranko-bg overflow-hidden`}
      >
        {/* BEFORE — real Unsplash photo */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            isActive ? "opacity-0" : "opacity-100"
          }`}
        >
          <img
            src={study.beforeImage}
            alt={study.beforeAlt}
            className="w-full h-full object-cover"
            loading={index < 2 ? "eager" : "lazy"}
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-pranko-bg/80 backdrop-blur-sm text-[10px] font-display font-bold uppercase tracking-wider text-white">
            Before
          </div>
        </div>

        {/* AFTER — video, with gradient poster fallback */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${study.afterFallbackGradient}`} />
          <video
            ref={registerVideo}
            src={study.afterVideo}
            muted
            playsInline
            loop
            preload="metadata"
            className="relative w-full h-full object-cover"
            onError={(e) => {
              // Hide the video element if the file doesn't exist yet —
              // the gradient poster behind it stays visible.
              (e.currentTarget as HTMLVideoElement).style.display = "none";
            }}
          />
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-pranko-lime text-pranko-bg text-[10px] font-display font-bold uppercase tracking-wider">
            After · AI
          </div>
        </div>

        {/* Category badge — always visible */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pranko-bg/70 backdrop-blur-sm text-xs font-semibold text-white">
          <span>{study.emoji}</span>
          <span className="uppercase tracking-wider">{study.categoryLabel}</span>
        </div>

        {/* Play hint */}
        {!isActive && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-pranko-bg/80 backdrop-blur-sm text-[10px] font-semibold text-white">
            <Play size={10} /> Hover to play
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="p-5">
        <h3 className="font-display font-bold text-white text-lg sm:text-xl mb-1">
          {t("title")}
        </h3>
        <p className="text-pranko-muted text-sm mb-2">{t("desc")}</p>
        <p className="text-pranko-lime/80 text-xs italic border-l-2 border-pranko-lime/30 pl-3">
          {t("story")}
        </p>
      </div>
    </motion.div>
  );
}
