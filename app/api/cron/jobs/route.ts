import { NextRequest, NextResponse } from "next/server";
import { runDueJobs } from "@/lib/jobs";
import { logInfo } from "@/lib/observability";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processed = await runDueJobs("default", {
    noop: async () => {},
  });
  logInfo("cron.jobs.completed", { processed });
  return NextResponse.json({ ok: true, processed });
}
