"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import UpgradeModal from "./UpgradeModal";
import type { UpgradeTrigger } from "@/lib/services/plan";

interface PlanGateProps {
  allowed: boolean;
  trigger: UpgradeTrigger;
  children: React.ReactNode;
  /** Show a lock overlay instead of hiding content */
  overlay?: boolean;
}

export default function PlanGate({ allowed, trigger, children, overlay = false }: PlanGateProps) {
  const [showModal, setShowModal] = useState(false);

  if (allowed) return <>{children}</>;

  if (overlay) {
    return (
      <>
        <div className="relative" onClick={() => setShowModal(true)}>
          <div className="pointer-events-none select-none opacity-40">{children}</div>
          <div className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-xl bg-black/40 backdrop-blur-[2px]">
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white">
              <Lock size={14} />
              Upgrade to unlock
            </div>
          </div>
        </div>
        {showModal && <UpgradeModal trigger={trigger} onClose={() => setShowModal(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
      >
        <Lock size={12} />
        Upgrade to unlock
      </button>
      {showModal && <UpgradeModal trigger={trigger} onClose={() => setShowModal(false)} />}
    </>
  );
}
