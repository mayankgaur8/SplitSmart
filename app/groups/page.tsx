import { GroupsPage } from "@/components/groups/GroupsPage";
import { AppShell } from "@/components/shared/AppShell";

export const metadata = { title: "Groups" };

export default function Groups() {
  return (
    <AppShell title="Groups">
      <GroupsPage />
    </AppShell>
  );
}
