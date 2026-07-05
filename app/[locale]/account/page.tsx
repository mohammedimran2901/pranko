"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Coins,
  Loader2,
  Sparkles,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────

interface DashboardData {
  userId: string | null;
  credits: number;
  weeklyCredits: number;
  subscriptionActive: boolean;
  subscriptionId: string | null;
  canceled: boolean;
  currentPeriodEnd: number | null;
  email: string | null;
}

// ── Page wrapper with Suspense ─────────────────────────────────────

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-pranko-lime" size={32} />
        </div>
      }
    >
      <AccountPageInner />
    </Suspense>
  );
}

function AccountPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("result");
  const prefix = locale === "en" ? "" : `/${locale}`;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canceledParam = searchParams.get("canceled");

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/credits");
      if (!res.ok) throw new Error("Failed to load account data");
      const d = await res.json();
      setData(d);
      if (canceledParam === "1") {
        setSuccessMsg("Subscription canceled. You'll keep your credits until the period ends.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [canceledParam]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cancel subscription
  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll keep your remaining credits until the current period ends.")) return;
    setCanceling(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/cancel-subscription", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to cancel");
      setSuccessMsg("Subscription canceled. Credits remain until period ends.");
      // Refresh data
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCanceling(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-pranko-lime" size={32} />
      </div>
    );
  }

  const subActive = data?.subscriptionActive || false;
  const canceled = data?.canceled || false;
  const periodEnd = data?.currentPeriodEnd
    ? new Date(data.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen px-4 sm:px-6 py-12 sm:py-20">
      <div className="max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-display text-3xl sm:text-4xl text-white mb-2">
            Your Account
          </h1>
          <p className="text-pranko-muted mb-8">
            Manage your Pranko subscription and credits.
          </p>
        </motion.div>

        {/* ── Error / Success banners ─────────────────────────────── */}
        {error && (
          <div className="card-pranko p-4 mb-4 border border-pranko-pink/40 flex items-start gap-3">
            <AlertCircle size={18} className="text-pranko-pink shrink-0 mt-0.5" />
            <p className="text-pranko-pink text-sm">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="card-pranko p-4 mb-4 border border-pranko-lime/40 flex items-start gap-3">
            <CheckCircle2 size={18} className="text-pranko-lime shrink-0 mt-0.5" />
            <p className="text-pranko-lime text-sm">{successMsg}</p>
          </div>
        )}

        {/* ── Credits card ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="card-pranko p-6 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display text-white">Credits</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pranko-lime/20 text-pranko-lime font-display font-bold">
              <Coins size={16} />
              {data?.credits ?? 0} / {data?.weeklyCredits ?? 6} used this week
            </span>
          </div>

          <div className="w-full bg-pranko-bg-lighter rounded-full h-3 mb-4">
            <div
              className="bg-pranko-lime h-3 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, ((data?.credits ?? 0) / (data?.weeklyCredits || 6)) * 100)
                )}%`,
              }}
            />
          </div>

          <Link
            href={`${prefix}/create`}
            className="btn-pranko w-full !py-4 glow-lime"
          >
            <Sparkles size={18} /> Create a prank video <ArrowRight size={16} />
          </Link>
        </motion.div>

        {/* ── Subscription card ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card-pranko p-6 mb-4"
        >
          <h2 className="text-lg font-display text-white mb-4">Subscription</h2>

          {subActive ? (
            <>
              <div className="flex items-center gap-2 text-pranko-lime mb-2">
                <CheckCircle2 size={18} />
                <span className="font-semibold">Active — $4.99/week</span>
              </div>
              {canceled ? (
                <p className="text-pranko-muted text-sm mb-4">
                  Canceled · Access ends {periodEnd || "at period end"}
                </p>
              ) : (
                <p className="text-pranko-muted text-sm mb-4">
                  Renews weekly · 6 credits refilled each week
                  {periodEnd && <> · Next renewal: {periodEnd}</>}
                </p>
              )}
              {!canceled && (
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  className="w-full px-4 py-3 rounded-xl border border-pranko-pink/40 text-pranko-pink hover:bg-pranko-pink/10 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {canceling ? (
                    <><Loader2 className="animate-spin" size={16} /> Canceling…</>
                  ) : (
                    <><XCircle size={16} /> Cancel subscription</>
                  )}
                </button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-pranko-muted mb-2">
                <XCircle size={18} />
                <span className="font-semibold">No active subscription</span>
              </div>
              <p className="text-pranko-muted text-sm mb-4">
                Subscribe to get 6 prank video credits every week.
              </p>
              <Link
                href={`${prefix}/pricing`}
                className="btn-pranko-pink w-full !py-3 glow-pink flex items-center justify-center gap-2"
              >
                <CreditCard size={16} /> Subscribe — $4.99/week
              </Link>
            </>
          )}

          {data?.email && (
            <p className="text-pranko-muted text-xs mt-3">
              Billing email: {data.email}
            </p>
          )}

          {/* Polar customer portal link */}
          {data?.subscriptionId && (
            <p className="text-pranko-muted text-[10px] mt-2 opacity-50">
              Polar sub: {data.subscriptionId}
            </p>
          )}
        </motion.div>

        {/* ── Quick links ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="card-pranko p-6"
        >
          <h2 className="text-lg font-display text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href={`${prefix}/create`}
              className="flex items-center justify-between p-3 rounded-xl bg-pranko-bg-lighter hover:bg-pranko-bg-lighter/80 transition-colors"
            >
              <span className="text-white">Create a prank</span>
              <ArrowRight size={16} className="text-pranko-muted" />
            </Link>
            <Link
              href={`${prefix}/pricing`}
              className="flex items-center justify-between p-3 rounded-xl bg-pranko-bg-lighter hover:bg-pranko-bg-lighter/80 transition-colors"
            >
              <span className="text-white">View pricing</span>
              <ExternalLink size={16} className="text-pranko-muted" />
            </Link>
            <Link
              href={`${prefix}`}
              className="flex items-center justify-between p-3 rounded-xl bg-pranko-bg-lighter hover:bg-pranko-bg-lighter/80 transition-colors"
            >
              <span className="text-white">Back to home</span>
              <ArrowRight size={16} className="text-pranko-muted" />
            </Link>
          </div>
        </motion.div>

        {/* Refresh button at bottom */}
        <div className="text-center mt-4">
          <button
            onClick={fetchData}
            className="text-pranko-muted text-xs hover:text-white inline-flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>
    </div>
  );
}