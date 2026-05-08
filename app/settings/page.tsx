import { SettingsPage } from "@/components/settings/SettingsPage";
import { AppShell } from "@/components/shared/AppShell";

export const metadata = { title: "Settings" };

export default function Settings() {
  return (
    <AppShell title="Settings">
      <SettingsPage />
    </AppShell>
  );
}
