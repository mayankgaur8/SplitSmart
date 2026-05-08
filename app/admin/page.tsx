import { AdminPanelPage } from "@/components/admin/AdminPanelPage";
import { AppShell } from "@/components/shared/AppShell";

export const metadata = { title: "Admin Panel" };

export default function Admin() {
  return (
    <AppShell title="Admin Panel">
      <AdminPanelPage />
    </AppShell>
  );
}
