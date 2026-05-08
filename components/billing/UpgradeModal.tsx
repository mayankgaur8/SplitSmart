"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Shield, Crown, Check } from "lucide-react";
import { PLAN_PRICING, UPGRADE_MESSAGES, type UpgradeTrigger } from "@/lib/services/plan";

interface UpgradeModalProps {
  trigger: UpgradeTrigger;
  onClose: () => void;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

const PLAN_FEATURES = {
  PRO: [
    "Unlimited groups & expenses",
    "AI receipt scanner (snap & auto-fill)",
    "AI spending insights & tips",
    "WhatsApp payment reminders",
    "Advanced analytics & charts",
    "Up to 50 members per group",
    "Priority support",
  ],
  TEAM: [
    "Everything in Pro",
    "Expense approval workflows",
    "Admin controls & permissions",
    "CSV / PDF export reports",
    "Unlimited members per group",
    "Custom expense categories",
    "Dedicated account manager",
  ],
};

export default function UpgradeModal({ trigger, onClose, onSuccess }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"PRO" | "TEAM">("PRO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const msg = UPGRADE_MESSAGES[trigger];

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, gateway: "RAZORPAY" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upgrade failed");

      if (data.data.gateway === "RAZORPAY") {
        const rzp = new window.Razorpay({
          key: data.data.keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          order_id: data.data.orderId,
          amount: data.data.amount * 100,
          currency: data.data.currency,
          name: "SplitSmart",
          description: `${selectedPlan} Plan — Monthly`,
          image: "/icons/icon-128.png",
          theme: { color: "#0ea5e9" },
          handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            // Webhook handles plan activation; close modal optimistically
            onSuccess?.();
            onClose();
          },
          modal: { ondismiss: () => setLoading(false) },
        });
        rzp.open();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1117] p-6 shadow-2xl"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600">
              <Zap size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{msg.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{msg.body}</p>
          </div>

          {/* Plan toggle */}
          <div className="mb-5 flex gap-2 rounded-xl bg-white/5 p-1">
            {(["PRO", "TEAM"] as const).map((plan) => (
              <button
                key={plan}
                onClick={() => setSelectedPlan(plan)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  selectedPlan === plan
                    ? "bg-gradient-to-r from-sky-500 to-violet-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {plan === "PRO" ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Shield size={14} /> Pro — ₹{PLAN_PRICING.PRO.INR}/mo
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <Crown size={14} /> Team — ₹{PLAN_PRICING.TEAM.INR}/mo
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Features */}
          <ul className="mb-6 space-y-2">
            {PLAN_FEATURES[selectedPlan].map((feat) => (
              <li key={feat} className="flex items-center gap-2.5 text-sm text-slate-300">
                <Check size={15} className="shrink-0 text-emerald-400" />
                {feat}
              </li>
            ))}
          </ul>

          {error && (
            <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

          {/* CTA */}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-violet-600 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Processing…" : msg.cta}
          </button>

          <p className="mt-3 text-center text-xs text-slate-500">
            Secure payment via Razorpay · Cancel anytime
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
