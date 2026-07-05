"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

export function Testimonials() {
  const t = useTranslations("testimonials");
  const items = t.raw("items") as { name: string; quote: string; stars: number }[];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-pranko-surface/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-display text-3xl sm:text-4xl text-white text-center mb-2">
          {t("title")}
        </h2>
        <p className="text-pranko-muted text-center mb-10 text-sm">
          {t("subtitle")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <div
              key={i}
              className="card-pranko p-5 flex flex-col gap-3 border border-pranko-border/50 hover:border-pranko-lime/30 transition-colors"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: item.stars }).map((_, s) => (
                  <Star key={s} size={14} className="text-pranko-lime fill-pranko-lime" />
                ))}
              </div>
              <p className="text-white text-sm leading-relaxed flex-1">
                "{item.quote}"
              </p>
              <p className="text-pranko-pink text-xs font-semibold">
                — {item.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}