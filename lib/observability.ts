import * as Sentry from "@sentry/nextjs";
import { NextRequest } from "next/server";
import crypto from "crypto";

export function getRequestId(req?: NextRequest): string {
  return req?.headers.get("x-request-id") ?? crypto.randomUUID();
}

export function logInfo(message: string, context: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ level: "info", message, at: new Date().toISOString(), ...context }));
}

export function logError(message: string, error: unknown, context: Record<string, unknown> = {}) {
  const err = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { error };
  console.error(JSON.stringify({ level: "error", message, at: new Date().toISOString(), ...context, ...err }));
  Sentry.captureException(error, { extra: context });
}

export function tagSentryUser(user?: { id?: string; email?: string | null; plan?: string }) {
  if (!user?.id) return;
  Sentry.setUser({ id: user.id, email: user.email ?? undefined });
  Sentry.setContext("plan", { plan: user.plan ?? "FREE" });
}

export async function withLatency<T>(
  operation: string,
  fn: () => Promise<T>,
  context: Record<string, unknown> = {}
): Promise<T> {
  const startedAt = performance.now();
  try {
    return await fn();
  } finally {
    logInfo("api.latency", {
      operation,
      durationMs: Math.round(performance.now() - startedAt),
      ...context,
    });
  }
}
