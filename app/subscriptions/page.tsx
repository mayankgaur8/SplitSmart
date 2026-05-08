import { SubscriptionsPage } from "@/components/subscriptions/SubscriptionsPage";
import { AppShell } from "@/components/shared/AppShell";

export const metadata = { title: "Subscriptions" };

export default function Subscriptions() {
  return (
    <AppShell title="Subscriptions">
      <SubscriptionsPage />
    </AppShell>
  );
}
