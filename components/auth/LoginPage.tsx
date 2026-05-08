"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff, ArrowRight, Smartphone } from "lucide-react";

export function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [tab, setTab] = useState<"email" | "otp">("email");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#060914] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-96 h-96 bg-sky-500 -top-20 -left-20" />
      <div className="orb w-80 h-80 bg-violet-500 bottom-0 right-0" />
      <div className="absolute inset-0 grid-pattern opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-xl">SplitSmart</span>
        </Link>

        <div className="rounded-2xl bg-[#0d1128]/90 border border-white/10 backdrop-blur-xl p-6 shadow-2xl">
          <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-6">Sign in to your account</p>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 mb-6">
            {(["email", "otp"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tab === t ? "bg-white/15 text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t === "email" ? "Email & Password" : "OTP Login"}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {tab === "email" ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    defaultValue="mayankgaur.8@gmail.com"
                    className="input-glass"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      className="input-glass pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <a href="#" className="text-xs text-sky-400 hover:text-sky-300">Forgot password?</a>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone Number</label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white font-medium">+91</span>
                    <input type="tel" className="input-glass flex-1" placeholder="98765 43210" />
                  </div>
                </div>
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={() => setOtpSent(true)}
                    className="w-full py-3 rounded-xl bg-white/8 border border-white/12 text-sm text-white font-semibold hover:bg-white/12 transition-all"
                  >
                    Send OTP
                  </button>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Enter 6-digit OTP</label>
                    <div className="flex gap-2 justify-between">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          id={`otp-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          className="w-10 h-11 text-center text-lg font-bold rounded-xl bg-white/8 border border-white/12 text-white outline-none focus:border-sky-500/60 focus:bg-sky-500/8 transition-all"
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      Didn&apos;t receive it?{" "}
                      <button type="button" className="text-sky-400 hover:text-sky-300">Resend</button>
                    </p>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-slate-500">or continue with</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Social logins */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Google", icon: Smartphone },
              { label: "Apple", icon: Smartphone },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/6 border border-white/10 text-sm text-white font-medium hover:bg-white/10 transition-all"
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-sky-400 hover:text-sky-300 font-semibold">
            Create one free
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
