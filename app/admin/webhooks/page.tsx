import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = {
  title: "Webhook Failures | SplitSmart Admin",
};
export const dynamic = "force-dynamic";

export default async function AdminWebhooksPage() {
  await requireRole("TEAM_ADMIN");
  const failures = await db.webhookEvent.findMany({
    where: { status: "FAILED" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Webhook Failures</h1>
        <p className="text-sm text-slate-400">Last 50 failed provider events for replay triage and support.</p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="p-3">Provider</th>
              <th className="p-3">Event</th>
              <th className="p-3">Type</th>
              <th className="p-3">Error</th>
              <th className="p-3">Received</th>
            </tr>
          </thead>
          <tbody>
            {failures.length === 0 ? (
              <tr><td className="p-6 text-slate-500" colSpan={5}>No failed webhooks.</td></tr>
            ) : failures.map((event) => (
              <tr key={event.id} className="border-t border-white/8">
                <td className="p-3 text-white">{event.provider}</td>
                <td className="p-3 font-mono text-xs text-slate-300">{event.eventId}</td>
                <td className="p-3 text-slate-300">{event.eventType}</td>
                <td className="p-3 text-red-300">{event.error ?? "Unknown"}</td>
                <td className="p-3 text-slate-500">{event.createdAt.toISOString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
