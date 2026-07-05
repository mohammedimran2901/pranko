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

        {/* TikTok-style vertical feed — scrollable row of phone cards */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-2">
          {CASE_STUDIES.map((cs, idx) => (
            <CaseStudyCard
              key={cs.id}
              study={cs}
              index={idx}
              isActive={activeId === cs.id}
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

/** Deterministic pseudo-random from a string seed (simple hash) */
function seedFrom(id: string, offset: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i) + offset) | 0;
  }
  return Math.abs(h);
}

function CaseStudyCard({
  study,
  index,
  isActive,
  onActivate,
  onDeactivate,
  registerVideo,
}: {
  study: CaseStudy;
  index: number;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  registerVideo: (el: HTMLVideoElement | null) => void;
}) {
  const t = useTranslations(`caseStudies.${study.id}`);
  // Deterministic counts — same on server & client, avoids hydration errors
  const likes = 100 + (seedFrom(study.id, 1) % 900);
  const comments = 5 + (seedFrom(study.id, 2) % 45);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.08 }}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onClick={isActive ? onDeactivate : onActivate}
      className="snap-start flex-shrink-0 w-[280px] sm:w-[320px] card-pranko overflow-hidden cursor-pointer group relative"
    >
      {/* Phone-shaped video container */}
      <div className="relative aspect-[9/16] bg-pranko-bg overflow-hidden rounded-2xl border-2 border-pranko-border/40">
        {/* BEFORE — real Unsplash photo (shown when not hovering) */}
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
          {/* Gradient overlay + title at bottom of "before" frame */}
          <div className="absolute inset-0 bg-gradient-to-t from-pranko-bg/90 via-pranko-bg/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display font-bold text-white text-lg leading-tight drop-shadow-lg">
              {t("title")}
            </h3>
          </div>
        </div>

        {/* AFTER — video (plays on hover) */}
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
              (e.currentTarget as HTMLVideoElement).style.display = "none";
            }}
          />
          {/* TikTok-style UI overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-pranko-bg/60 via-transparent to-transparent pointer-events-none" />
          {/* Right-side interaction icons (TikTok style) */}
          <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 pointer-events-none">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl drop-shadow-lg">❤️</span>
              <span className="text-white text-[10px] font-semibold drop-shadow-lg">{likes}K</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl drop-shadow-lg">💬</span>
              <span className="text-white text-[10px] font-semibold drop-shadow-lg">{comments}K</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl drop-shadow-lg">🔗</span>
              <span className="text-white text-[10px] font-semibold drop-shadow-lg">Share</span>
            </div>
          </div>
          {/* Bottom caption (TikTok style) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
            <p className="text-white text-sm font-semibold leading-snug drop-shadow-lg">
              {t("title")}
            </p>
            <p className="text-white/80 text-xs leading-snug mt-1 drop-shadow-lg">
              {t("story")}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-pranko-lime text-[10px] font-display font-bold">🎵 AI prank video</span>
            </div>
          </div>
        </div>

        {/* Play hint */}
        {!isActive && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-pranko-bg/80 backdrop-blur-sm text-[10px] font-semibold text-white">
            <Play size={10} /> Click to play
          </div>
        )}
      </div>

      {/* Caption below phone */}
      <div className="px-1 pt-3 pb-1">
        <p className="text-pranko-muted text-xs leading-snug">
          {t("desc")}
        </p>
      </div>
    </motion.div>
  );
}
