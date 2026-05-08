"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff, ArrowRight, CheckCircle, Users, CreditCard, Trophy } from "lucide-react";

const perks = [
  { icon: Users, text: "Split with unlimited groups" },
  { icon: CreditCard, text: "UPI & card settlements" },
  { icon: Trophy, text: "Earn streaks & badges" },
];

export function SignupPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#060914] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="orb w-96 h-96 bg-violet-500 -top-20 right-0" />
      <div className="orb w-80 h-80 bg-sky-500 bottom-0 -left-20" />
      <div className="absolute inset-0 grid-pattern opacity-40" />

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left panel */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
          <Link href="/" className="flex items-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-xl">SplitSmart</span>
          </Link>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Your shared money<br />
            <span className="gradient-text">OS starts here.</span>
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Join 12,800+ users who&apos;ve eliminated money awkwardness from their friendships.
          </p>
          <div className="space-y-4">
            {perks.map(({ icon: Icon, text }, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-sky-400" />
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 p-5 rounded-2xl bg-[#0d1128]/80 border border-white/8">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex -space-x-2">
                {["MG", "PS", "AP"].map((i, idx) => (
                  <div key={idx} className={`w-7 h-7 rounded-full border-2 border-[#060914] flex items-center justify-center text-[10px] font-bold text-white
                    ${["bg-sky-500", "bg-violet-500", "bg-emerald-500"][idx]}`}>{i}</div>
                ))}
              </div>
              <p className="text-xs text-slate-400"><strong className="text-white">3 new users</strong> joined in the last hour</p>
            </div>
            <p className="text-xs text-slate-500">Average user saves <strong className="text-emerald-400">₹2,400/year</strong> using AI insights.</p>
          </div>
        </motion.div>

        {/* Right — form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/" className="flex items-center justify-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">SplitSmart</span>
          </Link>

          <div className="rounded-2xl bg-[#0d1128]/90 border border-white/10 backdrop-blur-xl p-6 shadow-2xl">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s ? "bg-gradient-to-br from-sky-500 to-violet-500 text-white" : "bg-white/8 text-slate-500"
                  }`}>
                    {step > s ? <CheckCircle size={14} /> : s}
                  </div>
                  {s < 2 && <div className={`h-px w-8 transition-all ${step > s ? "bg-sky-500" : "bg-white/10"}`} />}
                </div>
              ))}
              <span className="text-xs text-slate-500 ml-2">Step {step} of 2</span>
            </div>

            <h1 className="text-xl font-bold text-white mb-1">
              {step === 1 ? "Create your account" : "Complete your profile"}
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              {step === 1 ? "Free forever. No credit card required." : "Help us personalize your experience."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">First Name</label>
                      <input className="input-glass" placeholder="Mayank" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Last Name</label>
                      <input className="input-glass" placeholder="Gaur" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                    <input type="email" className="input-glass" placeholder="you@example.com" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showPass ? "text" : "password"} className="input-glass pr-10" placeholder="Min. 8 characters" required />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone (for UPI)</label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white font-medium">+91</span>
                      <input type="tel" className="input-glass flex-1" placeholder="98765 43210" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">I primarily use SplitSmart for…</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Flatmates", "Travel", "Subscriptions", "Team/Work"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-sky-500/40 transition-all text-sm text-slate-300">
                          <input type="checkbox" className="accent-sky-500" />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Referral code (optional)</label>
                    <input className="input-glass" placeholder="SPLIT2024" />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{step === 1 ? "Continue" : "Create Account"} <ArrowRight size={15} /></>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-600 mt-4">
              By signing up, you agree to our{" "}
              <a href="#" className="text-slate-400 hover:text-white">Terms</a> and{" "}
              <a href="#" className="text-slate-400 hover:text-white">Privacy Policy</a>
            </p>
          </div>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-sky-400 hover:text-sky-300 font-semibold">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
