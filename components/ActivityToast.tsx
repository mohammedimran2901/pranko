"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

const SAMPLE_NAMES = [
  "Sarah", "Mike", "Jordan", "Emma", "Alex", "Taylor", "Casey", "Morgan",
  "Riley", "Quinn", "Avery", "Blake", "Cameron", "Drew", "Harper",
  "Jess", "Pat", "Sam", "Toni", "Chris", "Dana", "Lee", "Reese",
];

const SAMPLE_ACTIONS = ["created a prank video", "subscribed to Weekly"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface Toast {
  id: number;
  name: string;
  action: string;
}

export function ActivityToast() {
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    function showToast() {
      const id = Date.now();
      setToast({
        id,
        name: randomItem(SAMPLE_NAMES),
        action: randomItem(SAMPLE_ACTIONS),
      });

      setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, 3000);
    }

    // Show first toast after 3 seconds
    const first = setTimeout(showToast, 3000);
    // Then every 6-10 seconds
    const interval = setInterval(() => {
      showToast();
    }, 6000 + Math.random() * 4000);

    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 40, x: -10 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-6 left-4 sm:left-6 z-40 max-w-xs"
        >
          <div className="card-pranko px-4 py-3 border border-pranko-lime/30 flex items-center gap-3 shadow-lg shadow-pranko-lime/5">
            <div className="w-8 h-8 rounded-full bg-pranko-lime/20 flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-pranko-lime" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {toast.name}
              </p>
              <p className="text-pranko-muted text-[11px] truncate">
                {toast.action} · Just now
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}