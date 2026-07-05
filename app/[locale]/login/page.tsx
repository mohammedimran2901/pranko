"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-pranko-lime" size={32} />
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const prefix = locale === "en" ? "" : `/${locale}`;

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnTo = searchParams.get("returnTo") || `${prefix}/account`;
  const justSignedIn = searchParams.get("signedIn") === "1";

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || sending) return;
    setSending(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: sendError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}${prefix}/api/auth/callback?returnTo=${encodeURIComponent(returnTo)}`,
        },
      });

      if (sendError) throw sendError;
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send link");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-display text-3xl sm:text-4xl text-white mb-2">
            {justSignedIn ? "Welcome back!" : "Sign in"}
          </h1>
          <p className="text-pranko-muted">
            {justSignedIn
              ? "You're signed in. Your credits are now linked to your account."
              : "Enter your email and we'll send you a magic link. No password needed."}
          </p>
        </div>

        {justSignedIn ? (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 text-pranko-lime">
              <CheckCircle2 size={20} /> Signed in successfully
            </div>
            <button
              onClick={() => router.push(returnTo)}
              className="btn-pranko w-full !py-4 glow-lime"
            >
              Go to account <ArrowRight size={18} />
            </button>
          </div>
        ) : sent ? (
          <div className="card-pranko p-6 text-center">
            <CheckCircle2 size={48} className="text-pranko-lime mx-auto mb-3" />
            <h2 className="text-white font-display text-xl mb-2">
              Check your email
            </h2>
            <p className="text-pranko-muted text-sm mb-4">
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </p>
            <p className="text-pranko-muted text-xs">
              Didn't get it? Check spam or{" "}
              <button
                onClick={() => setSent(false)}
                className="text-pranko-lime underline"
              >
                try again
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendLink} className="card-pranko p-6">
            <label className="block text-sm text-pranko-muted mb-2">
              Email address
            </label>
            <div className="relative mb-4">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-pranko-muted"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-pranko-bg-lighter border border-pranko-border text-white placeholder:text-pranko-muted focus:outline-none focus:border-pranko-lime transition-colors"
              />
            </div>

            {error && (
              <p className="text-pranko-pink text-sm mb-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={sending || !email}
              className="btn-pranko w-full !py-4 glow-lime disabled:opacity-50"
            >
              {sending ? (
                <><Loader2 className="animate-spin" size={18} /> Sending link…</>
              ) : (
                <>Send magic link <ArrowRight size={18} /></>
              )}
            </button>

            <p className="text-pranko-muted text-xs text-center mt-4">
              By signing in you agree to our terms. No spam, just login links.
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}