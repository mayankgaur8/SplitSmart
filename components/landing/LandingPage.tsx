"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap, Users, CreditCard, ArrowLeftRight, Trophy, BarChart3,
  Shield, Bell, Smartphone, CheckCircle, Star, ChevronRight,
  Play, ArrowRight, Menu, X, Sparkles, TrendingDown, Brain,
  Globe, Lock, Rocket, Receipt,
} from "lucide-react";

/* ─── Navbar ─────────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#060914]/90 backdrop-blur-xl border-b border-white/8" : ""}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg">SplitSmart</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {["Features", "How It Works", "Pricing", "Testimonials"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm text-slate-400 hover:text-white transition-colors font-medium">
              {item}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-300 hover:text-white font-medium transition-colors">
            Sign In
          </Link>
          <Link href="/signup"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            Get Started Free
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile menu */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-slate-300 hover:text-white p-1">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-[#0d1128] border-b border-white/8 px-4 py-4 space-y-3">
          {["Features", "How It Works", "Pricing", "Testimonials"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="block text-sm text-slate-300 hover:text-white py-1.5 font-medium"
              onClick={() => setMobileOpen(false)}>
              {item}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <Link href="/login" className="flex-1 text-center py-2.5 rounded-xl border border-white/15 text-sm text-white font-semibold">
              Sign In
            </Link>
            <Link href="/signup" className="flex-1 text-center py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 text-white text-sm font-semibold">
              Get Started
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden animated-bg grid-pattern pt-16">
      {/* Orbs */}
      <div className="orb w-[600px] h-[600px] bg-sky-500 -top-40 -left-40" />
      <div className="orb w-[500px] h-[500px] bg-violet-500 top-20 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-pink-500 bottom-0 left-1/3" />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Pill badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/15 border border-sky-500/25 text-sky-400 text-sm font-semibold mb-8">
          <Sparkles className="w-4 h-4" />
          <span>AI-Powered Expense Intelligence</span>
          <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-xs">NEW</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 tracking-tight">
          Split Money.<br />
          <span className="gradient-text">Kill the Awkward</span><br />
          Conversation.
        </motion.h1>

        {/* Subheadline */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          The shared money OS for flatmates, travelers, couples, and teams.
          AI-powered splitting, instant UPI settlements, and gamified payments — zero drama.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/signup"
            className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 text-white text-base font-bold hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-2xl shadow-sky-500/25">
            Start Splitting Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link href="/dashboard"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/8 border border-white/12 text-white text-base font-semibold hover:bg-white/12 transition-all hover:-translate-y-0.5">
            <Play className="w-4 h-4 fill-white" />
            View Live Demo
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {["MG", "PS", "RM", "AP", "KS"].map((initials, i) => (
                <div key={i} className={`w-7 h-7 rounded-full border-2 border-[#060914] flex items-center justify-center text-[10px] font-bold text-white
                  ${["bg-sky-500", "bg-violet-500", "bg-pink-500", "bg-emerald-500", "bg-amber-500"][i]}`}>
                  {initials}
                </div>
              ))}
            </div>
            <span><strong className="text-white">12,800+</strong> active users</span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
            <span className="ml-1"><strong className="text-white">4.9</strong> / 5.0</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>No credit card required</span>
          </div>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-16 relative">
          <div className="relative mx-auto max-w-4xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60"
            style={{ background: "linear-gradient(145deg, #0d1128, #0a0f23)" }}>
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-black/20">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white/8 rounded-lg px-3 py-1 text-xs text-slate-400 text-center max-w-xs mx-auto">
                  app.splitsmart.io/dashboard
                </div>
              </div>
            </div>
            {/* Fake dashboard UI */}
            <div className="p-6 grid grid-cols-4 gap-4">
              {[
                { label: "You're Owed", value: "₹32,400", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "You Owe", value: "₹8,200", color: "text-red-400", bg: "bg-red-500/10" },
                { label: "Net Balance", value: "+₹24,200", color: "text-sky-400", bg: "bg-sky-500/10" },
                { label: "Pay Streak", value: "14 days 🔥", color: "text-amber-400", bg: "bg-amber-500/10" },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 + i * 0.1 }}
                  className={`rounded-xl p-3 border border-white/8 ${stat.bg}`}>
                  <p className="text-[11px] text-slate-500 mb-1">{stat.label}</p>
                  <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
                </motion.div>
              ))}
              <div className="col-span-2 rounded-xl p-3 border border-white/8 bg-white/3">
                <p className="text-[11px] text-slate-500 mb-2">Recent Activity</p>
                {["Feb Rent · ₹20,000", "Netflix · ₹163", "Goa Hotel · ₹6,000"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1 border-b border-white/5 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span className="text-xs text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
              <div className="col-span-2 rounded-xl p-3 border border-white/8 bg-white/3">
                <p className="text-[11px] text-slate-500 mb-2">AI Insight ✨</p>
                <div className="flex items-start gap-2">
                  <Brain className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">Cancel Hotstar — save ₹100/mo. You&apos;ve watched it only 3 times this month.</p>
                </div>
              </div>
            </div>
          </div>
          {/* Glow under */}
          <div className="absolute inset-x-1/4 -bottom-8 h-16 bg-gradient-to-r from-sky-500/30 to-violet-500/30 blur-3xl rounded-full" />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Features ────────────────────────────────────────────────────────────── */
const features = [
  {
    icon: Brain,
    color: "from-violet-500 to-pink-500",
    title: "AI-Powered Insights",
    desc: "Auto-categorize expenses, detect subscription waste, and get personalized savings recommendations.",
  },
  {
    icon: ArrowLeftRight,
    color: "from-sky-500 to-cyan-500",
    title: "Debt Minimization",
    desc: "Our algorithm reduces 12 payments to just 2. Minimum transactions, maximum clarity.",
  },
  {
    icon: Zap,
    color: "from-amber-500 to-orange-500",
    title: "Instant UPI Settlements",
    desc: "One-click payments via UPI, cards, or wallets. No more \"I'll pay you later\" conversations.",
  },
  {
    icon: Trophy,
    color: "from-emerald-500 to-teal-500",
    title: "Gamification Engine",
    desc: "Streaks, badges, leaderboards, and reputation scores that make splitting actually fun.",
  },
  {
    icon: CreditCard,
    color: "from-pink-500 to-rose-500",
    title: "Subscription Manager",
    desc: "Track Netflix, Spotify, and 50+ services. Share pools intelligently and cancel unused plans.",
  },
  {
    icon: Bell,
    color: "from-sky-500 to-violet-500",
    title: "Smart Reminders",
    desc: "Friendly nudges via push, WhatsApp, and email. Never awkward, always timely.",
  },
  {
    icon: BarChart3,
    color: "from-teal-500 to-emerald-500",
    title: "Spending Analytics",
    desc: "Beautiful charts showing where group money goes. Spot trends before they become problems.",
  },
  {
    icon: Shield,
    color: "from-slate-500 to-slate-400",
    title: "Bank-grade Security",
    desc: "256-bit encryption, fraud detection, GDPR-compliant. Your money data stays private.",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-semibold mb-4">
          <Sparkles className="w-4 h-4" />Everything you need
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl font-black text-white mb-4">
          The complete shared money OS
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
          className="text-slate-400 text-lg max-w-2xl mx-auto">
          Everything Splitwise wished it had, with the UX of Revolut and the intelligence of ChatGPT.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.07 }}
            className="group rounded-2xl p-5 bg-[#0d1128]/80 border border-white/8 hover:border-white/15 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <f.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-bold mb-2 text-sm">{f.title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── How It Works ────────────────────────────────────────────────────────── */
const steps = [
  {
    step: "01",
    title: "Create a Group",
    desc: "Add your flatmates, travel buddies, or team. Share an invite link — they join in seconds.",
    icon: Users,
  },
  {
    step: "02",
    title: "Log Expenses",
    desc: "Snap a receipt or type it in. AI auto-detects merchant, category, and suggests split type.",
    icon: Receipt,
  },
  {
    step: "03",
    title: "AI Optimizes",
    desc: "Our algorithm minimizes the number of payments needed across all debts in your group.",
    icon: Brain,
  },
  {
    step: "04",
    title: "Settle Instantly",
    desc: "One-tap UPI payment. Mark as paid. Done. Your score goes up. 🎉",
    icon: Zap,
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#0a0d1f]/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-black text-white mb-4">
            Up and running in <span className="gradient-text">4 minutes</span>
          </motion.h2>
          <p className="text-slate-400 text-lg">Not 4 days. Not 4 hours. 4 minutes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-sky-500/40 to-transparent z-0" />
              )}
              <div className="relative z-10 text-center p-6 rounded-2xl bg-[#0d1128]/80 border border-white/8">
                <div className="text-4xl font-black gradient-text mb-4">{s.step}</div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-sky-500/20 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-white font-bold mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ─────────────────────────────────────────────────────────────── */
const plans = [
  {
    name: "Free",
    price: 0,
    period: "/month",
    desc: "Perfect for trying out",
    badge: null,
    features: [
      "Up to 3 groups",
      "Basic expense splitting",
      "Manual settlements",
      "7-day activity history",
      "Community support",
    ],
    cta: "Get Started Free",
    ctaStyle: "border border-white/20 text-white hover:bg-white/8",
  },
  {
    name: "Pro",
    price: 299,
    period: "/month",
    desc: "For power users",
    badge: "Most Popular",
    features: [
      "Unlimited groups",
      "AI expense insights",
      "Smart reminders (WhatsApp + Email)",
      "Full analytics dashboard",
      "Gamification & leaderboards",
      "Priority support",
      "Receipt OCR scanning",
    ],
    cta: "Start Pro Free",
    ctaStyle: "bg-gradient-to-r from-sky-500 to-violet-500 text-white hover:opacity-90",
  },
  {
    name: "Team",
    price: 999,
    period: "/month",
    desc: "For startups & companies",
    badge: null,
    features: [
      "Everything in Pro",
      "Expense approvals workflow",
      "Team admin controls",
      "CSV/PDF expense reports",
      "Bulk expense import",
      "Custom categories",
      "Dedicated account manager",
      "Audit logs",
    ],
    cta: "Contact Sales",
    ctaStyle: "border border-violet-500/50 text-violet-400 hover:bg-violet-500/10",
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-4xl sm:text-5xl font-black text-white mb-4">
          Simple, transparent pricing
        </motion.h2>
        <p className="text-slate-400 text-lg">Start free. Upgrade when you need more. Cancel anytime.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className={`relative rounded-2xl p-6 border transition-all hover:-translate-y-1 ${
              plan.badge
                ? "bg-gradient-to-b from-sky-500/10 to-violet-500/5 border-sky-500/30 shadow-xl shadow-sky-500/10"
                : "bg-[#0d1128]/80 border-white/8"
            }`}>
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 text-white text-xs font-bold">
                {plan.badge}
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
              <p className="text-slate-500 text-sm mb-4">{plan.desc}</p>
              <div className="flex items-end gap-1">
                <span className="text-slate-400 text-lg">₹</span>
                <span className="text-4xl font-black text-white">{plan.price}</span>
                <span className="text-slate-500 mb-1">{plan.period}</span>
              </div>
            </div>
            <ul className="space-y-2.5 mb-8">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/signup"
              className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all ${plan.ctaStyle}`}>
              {plan.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── Testimonials ────────────────────────────────────────────────────────── */
const testimonials = [
  {
    name: "Riya Kapoor",
    role: "Software Engineer, Bangalore",
    text: "We split Netflix, Hotstar, and rent for 4 flatmates. SplitSmart saves me 2 hours of WhatsApp arguments every month. The AI insights actually got us to cancel Hotstar since nobody was using it.",
    avatar: "RK",
    rating: 5,
  },
  {
    name: "Arjun Reddy",
    role: "Startup Founder, Hyderabad",
    text: "Our team of 8 uses the Team plan for office expenses, vendor payments, and shared tools. The approval workflow is perfect. Way better than Google Sheets.",
    avatar: "AR",
    rating: 5,
  },
  {
    name: "Meera Joshi",
    role: "Travel Blogger",
    text: "Went on a 3-week Europe trip with 5 friends. SplitSmart calculated all our debts and said only 4 payments needed instead of 20. Absolute lifesaver.",
    avatar: "MJ",
    rating: 5,
  },
  {
    name: "Vikram Nair",
    role: "Product Manager, Mumbai",
    text: "The payment streaks and badges actually made me excited to pay bills on time. My reputation score went from 61 to 89 in 2 months. Genuinely addictive.",
    avatar: "VN",
    rating: 5,
  },
  {
    name: "Priyanka Das",
    role: "Data Analyst, Pune",
    text: "The analytics dashboard showed me I was spending 34% more on food delivery than I thought. The category breakdowns are eye-opening and beautifully designed.",
    avatar: "PD",
    rating: 5,
  },
  {
    name: "Aditya Kumar",
    role: "Remote Freelancer, Goa",
    text: "Running a co-working space with 6 people. The recurring expense tracking for rent and utilities is flawless. One-click UPI payments mean zero follow-ups.",
    avatar: "AK",
    rating: 5,
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-[#0a0d1f]/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-black text-white mb-4">
            Loved by 12,800+ users
          </motion.h2>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            <span className="text-slate-400 ml-2 text-sm">4.9/5 from 2,400+ reviews</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="p-5 rounded-2xl bg-[#0d1128]/80 border border-white/8 hover:border-white/15 transition-all">
              <div className="flex gap-0.5 mb-3">
                {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Trust & Security ────────────────────────────────────────────────────── */
const trustItems = [
  { icon: Lock, label: "256-bit encryption" },
  { icon: Shield, label: "GDPR compliant" },
  { icon: Globe, label: "India-first payments" },
  { icon: Rocket, label: "99.9% uptime SLA" },
  { icon: TrendingDown, label: "Fraud detection AI" },
  { icon: CheckCircle, label: "RBI guidelines met" },
];

function Trust() {
  return (
    <section className="py-16 px-4 border-y border-white/6">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-slate-500 text-sm font-medium mb-8 uppercase tracking-wider">
          Built with security-first architecture
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {trustItems.map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/3 border border-white/6">
              <item.icon className="w-5 h-5 text-sky-400" />
              <span className="text-xs text-slate-400 text-center font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Banner ──────────────────────────────────────────────────────────── */
function CTABanner() {
  return (
    <section className="py-24 px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-violet-500/10 rounded-3xl blur-xl" />
        <div className="relative rounded-3xl border border-white/10 bg-[#0d1128]/90 p-12">
          <div className="orb w-64 h-64 bg-sky-500 -top-20 -left-20 opacity-10" />
          <div className="orb w-64 h-64 bg-violet-500 -bottom-20 -right-20 opacity-10" />
          <h2 className="text-4xl font-black text-white mb-4 relative z-10">
            Stop chasing money.<br />
            <span className="gradient-text">Start living better.</span>
          </h2>
          <p className="text-slate-400 mb-8 text-lg relative z-10">
            Join 12,800+ users who&apos;ve eliminated money awkwardness from their friendships.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
            <Link href="/signup"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 text-white text-base font-bold hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-xl shadow-sky-500/25">
              Create Free Account
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <p className="text-slate-600 text-xs mt-4 relative z-10">
            Free plan forever · No credit card required · Setup in 4 minutes
          </p>
        </div>
      </motion.div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-white/8 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">SplitSmart</span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              The AI-powered shared money OS. Built for the modern era of splitting bills, subscriptions, and friendships.
            </p>
            <div className="flex gap-3 mt-5">
              {["Twitter", "LinkedIn", "Discord", "GitHub"].map((s) => (
                <a key={s} href="#" className="text-xs text-slate-500 hover:text-white transition-colors font-medium">{s}</a>
              ))}
            </div>
          </div>
          {[
            { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap", "API Docs"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Press", "Contact"] },
            { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-slate-500 text-xs hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-600 text-xs">© 2026 SplitSmart Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Available on iOS & Android (coming soon)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Main export ─────────────────────────────────────────────────────────── */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060914]">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Trust />
      <Pricing />
      <Testimonials />
      <CTABanner />
      <Footer />
    </div>
  );
}
