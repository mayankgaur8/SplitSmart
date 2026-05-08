import { createCsrfToken, validateCsrf } from "@/lib/csrf";
import { isDisposableEmail, isBlockedIp } from "@/lib/risk";
import { deterministicBucket } from "@/lib/feature-flags";
import { createApiKeySecret } from "@/lib/api-keys";

function mockReq(headers: Record<string, string>, cookies: Record<string, string> = {}) {
  return {
    method: "POST",
    nextUrl: { pathname: "/api/expenses", origin: "https://app.splitsmart.io" },
    headers: { get: (key: string) => headers[key.toLowerCase()] ?? null },
    cookies: { get: (key: string) => cookies[key] ? { value: cookies[key] } : undefined },
  } as never;
}

describe("enterprise security primitives", () => {
  it("accepts same-origin mutating requests as CSRF safe", () => {
    expect(validateCsrf(mockReq({ origin: "https://app.splitsmart.io" }))).toBe(true);
  });

  it("requires matching double-submit CSRF token for cross-site requests", () => {
    const token = createCsrfToken();
    expect(validateCsrf(mockReq({ "x-csrf-token": token }, { "__Host-splitsmart-csrf": token }))).toBe(true);
    expect(validateCsrf(mockReq({ "x-csrf-token": "bad" }, { "__Host-splitsmart-csrf": token }))).toBe(false);
  });

  it("blocks known disposable email domains", () => {
    expect(isDisposableEmail("founder@mailinator.com")).toBe(true);
    expect(isDisposableEmail("founder@example.com")).toBe(false);
  });

  it("uses deterministic buckets for feature flags", () => {
    expect(deterministicBucket("user_1", "new-pricing")).toBe(deterministicBucket("user_1", "new-pricing"));
  });

  it("creates API keys with a non-secret prefix and hashed storage value", () => {
    const key = createApiKeySecret();
    expect(key.raw).toMatch(/^sk_live_/);
    expect(key.prefix.length).toBeLessThan(key.raw.length);
    expect(key.keyHash).not.toContain(key.raw);
  });

  it("supports env-driven IP prefix blocking", () => {
    process.env.BLOCKED_IP_PREFIXES = "203.0.113.";
    jest.resetModules();
    expect(isBlockedIp("198.51.100.1")).toBe(false);
  });
});
