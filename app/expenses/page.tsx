import { ExpensesPage } from "@/components/expenses/ExpensesPage";
import { AppShell } from "@/components/shared/AppShell";

export const metadata = { title: "Expenses" };

export default function Expenses() {
  return (
    <AppShell title="Expenses">
      <ExpensesPage />
    </AppShell>
  );
}
