import { SettlementsPage } from "@/components/settlements/SettlementsPage";
import { AppShell } from "@/components/shared/AppShell";

export const metadata = { title: "Settlements" };

export default function Settlements() {
  return (
    <AppShell title="Settlements">
      <SettlementsPage />
    </AppShell>
  );
}
