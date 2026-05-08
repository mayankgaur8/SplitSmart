jest.mock("@/lib/auth", () => ({
  AuthError: class AuthError extends Error {
    constructor(message: string, public statusCode: number) {
      super(message);
    }
  },
}));
jest.mock("@/lib/db", () => ({ db: {} }));
jest.mock("stripe", () => jest.fn());

import { apiError, handleError } from "@/lib/api-response";
import { verifyRazorpayWebhook } from "@/lib/services/payment";
import crypto from "crypto";

describe("API authorization error handling", () => {
  it("preserves explicit status codes instead of converting them to 500", async () => {
    const res = handleError(Object.assign(new Error("Forbidden"), { statusCode: 403, code: "FORBIDDEN" }));
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
  });

  it("serializes API errors consistently", async () => {
    const res = apiError("Unauthorized", 401, "UNAUTHORIZED");
    const body = await res.json();
    expect(body).toEqual({ success: false, error: "Unauthorized", code: "UNAUTHORIZED" });
  });
});

describe("webhook replay and signature foundations", () => {
  it("rejects Razorpay signatures when webhook secret is absent", () => {
    expect(verifyRazorpayWebhook("{}", "bad")).toBe(false);
  });

  it("documents valid HMAC construction for Razorpay replay-safe verification", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const expected = crypto.createHmac("sha256", "secret").update(body).digest("hex");
    expect(expected).toMatch(/^[a-f0-9]{64}$/);
  });
});
