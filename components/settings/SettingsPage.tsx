"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Bell, Shield, CreditCard, Globe, Moon,
  ChevronRight, Zap, Smartphone, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { CURRENT_USER } from "@/lib/mock-data";

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "relative w-10 h-5 rounded-full transition-all flex-shrink-0",
        enabled ? "bg-sky-500" : "bg-white/15"
      )}
    >
      <div className={cn(
        "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
        enabled ? "left-5.5 left-[22px]" : "left-0.5"
      )} />
    </button>
  );
}

const sidebarItems = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "preferences", label: "Preferences", icon: Globe },
];

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [notifications, setNotifications] = useState({
    push: true, email: true, whatsapp: false,
    paymentDue: true, newExpense: true, settlement: true, weekly: false,
  });

  return (
    <div className="flex gap-6">
      {/* Settings sidebar */}
      <div className="w-52 flex-shrink-0 hidden md:block">
        <Card padding="sm">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left mb-0.5",
                  activeSection === item.id
                    ? "bg-sky-500/15 text-sky-400"
                    : "text-slate-400 hover:text-white hover:bg-white/6"
                )}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </Card>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {activeSection === "profile" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <h2 className="text-xl font-bold text-white">Profile Settings</h2>

            {/* Avatar section */}
            <Card padding="md">
              <div className="flex items-center gap-4 mb-5">
                <div className="relative">
                  <Avatar name={CURRENT_USER.name} size="xl" isOnline />
                  <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center border-2 border-[#0d1128]">
                    <User size={10} className="text-white" />
                  </button>
                </div>
                <div>
                  <h3 className="text-white font-bold">{CURRENT_USER.name}</h3>
                  <p className="text-slate-500 text-sm">{CURRENT_USER.email}</p>
                  <Badge variant="info" size="sm" className="mt-1">Pro Plan</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "First Name", value: "Mayank", placeholder: "First name" },
                  { label: "Last Name", value: "Gaur", placeholder: "Last name" },
                  { label: "Email", value: CURRENT_USER.email, placeholder: "Email" },
                  { label: "Phone", value: "+91 98765 43210", placeholder: "Phone" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</label>
                    <input defaultValue={f.value} className="input-glass" placeholder={f.placeholder} />
                  </div>
                ))}
              </div>
              <Button className="mt-5" leftIcon={<Check size={14} />}>Save Changes</Button>
            </Card>

            {/* Plan */}
            <Card padding="md" className="bg-gradient-to-br from-sky-500/8 to-violet-500/8 border-sky-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold">Pro Plan</p>
                    <p className="text-slate-500 text-xs">₹299/month · Renews Jan 15</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm">Upgrade to Team</Button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Groups", used: "4", max: "∞" },
                  { label: "AI Insights", used: "28", max: "∞" },
                  { label: "Storage", used: "2.1GB", max: "10GB" },
                ].map((item) => (
                  <div key={item.label} className="p-2.5 rounded-xl bg-white/5">
                    <p className="text-white font-bold text-sm">{item.used}<span className="text-slate-500">/{item.max}</span></p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {activeSection === "notifications" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <h2 className="text-xl font-bold text-white">Notification Settings</h2>
            <Card padding="md">
              <h3 className="text-sm font-bold text-white mb-4">Channels</h3>
              <div className="space-y-4">
                {[
                  { key: "push" as const, label: "Push Notifications", desc: "In-app and mobile push", icon: Smartphone },
                  { key: "email" as const, label: "Email Notifications", desc: "Summary and alerts to email", icon: Bell },
                  { key: "whatsapp" as const, label: "WhatsApp Reminders", desc: "Payment reminders via WhatsApp", icon: Globe },
                ].map(({ key, label, desc, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center">
                        <Icon size={15} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{label}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                    </div>
                    <Toggle enabled={notifications[key]} onChange={() => setNotifications({ ...notifications, [key]: !notifications[key] })} />
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="md">
              <h3 className="text-sm font-bold text-white mb-4">Notification Types</h3>
              <div className="space-y-3">
                {[
                  { key: "paymentDue" as const, label: "Payment reminders", desc: "When bills are due" },
                  { key: "newExpense" as const, label: "New expenses", desc: "When someone adds an expense" },
                  { key: "settlement" as const, label: "Settlement updates", desc: "Payment confirmations" },
                  { key: "weekly" as const, label: "Weekly summary", desc: "Weekly spending digest" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm text-white">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                    <Toggle enabled={notifications[key]} onChange={() => setNotifications({ ...notifications, [key]: !notifications[key] })} />
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {activeSection === "payments" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <h2 className="text-xl font-bold text-white">Payment Methods</h2>
            <Card padding="md">
              <h3 className="text-sm font-bold text-white mb-4">Saved UPI IDs</h3>
              <div className="space-y-3 mb-4">
                {[
                  { id: "mayank@okicici", primary: true },
                  { id: "mayank.gaur@ybl", primary: false },
                ].map((upi) => (
                  <div key={upi.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/8">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center">
                      <Smartphone size={14} className="text-sky-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-mono text-white">{upi.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {upi.primary && <Badge variant="success" size="sm">Primary</Badge>}
                      <ChevronRight size={14} className="text-slate-600" />
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="secondary" size="sm" leftIcon={<CreditCard size={14} />}>+ Add UPI ID</Button>
            </Card>
          </motion.div>
        )}

        {activeSection === "security" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <h2 className="text-xl font-bold text-white">Security</h2>
            <Card padding="md">
              {[
                { label: "Change Password", desc: "Last changed 45 days ago" },
                { label: "Two-Factor Authentication", desc: "Not enabled — recommended", badge: "Warning" },
                { label: "Active Sessions", desc: "2 devices currently signed in" },
                { label: "Login History", desc: "View recent sign-ins" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3.5 border-b border-white/6 last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      {item.badge && <Badge variant="warning" size="sm">{item.badge}</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight size={15} className="text-slate-600" />
                </div>
              ))}
            </Card>
          </motion.div>
        )}

        {activeSection === "preferences" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <h2 className="text-xl font-bold text-white">Preferences</h2>
            <Card padding="md">
              <div className="space-y-4">
                {[
                  { label: "Default Currency", options: ["INR", "USD", "EUR", "GBP"], value: "INR" },
                  { label: "Language", options: ["English", "Hindi", "Tamil", "Telugu"], value: "English" },
                  { label: "Default Split Type", options: ["Equal", "Percentage", "Custom"], value: "Equal" },
                ].map((pref) => (
                  <div key={pref.label}>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">{pref.label}</label>
                    <select defaultValue={pref.value} className="input-glass">
                      {pref.options.map((opt) => (
                        <option key={opt} className="bg-[#0d1128]">{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <Button className="mt-5" leftIcon={<Check size={14} />}>Save Preferences</Button>
            </Card>

            <Card padding="md" className="border-red-500/20">
              <h3 className="text-sm font-bold text-red-400 mb-3">Danger Zone</h3>
              <div className="space-y-3">
                <Button variant="danger" size="sm" fullWidth>Export All Data</Button>
                <Button variant="danger" size="sm" fullWidth>Delete Account</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
