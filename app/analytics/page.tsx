import { AnalyticsPage } from "@/components/analytics/AnalyticsPage";
import { AppShell } from "@/components/shared/AppShell";

export const metadata = { title: "Analytics" };

export default function Analytics() {
  return (
    <AppShell title="Analytics & Insights">
      <AnalyticsPage />
    </AppShell>
  );
}
