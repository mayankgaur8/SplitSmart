import { GamificationPage } from "@/components/gamification/GamificationPage";
import { AppShell } from "@/components/shared/AppShell";

export const metadata = { title: "Rewards" };

export default function Gamification() {
  return (
    <AppShell title="Rewards & Reputation">
      <GamificationPage />
    </AppShell>
  );
}
