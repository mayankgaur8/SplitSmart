import crypto from "crypto";

// Mock db to avoid PrismaClient adapter requirement in unit tests
jest.mock("@/lib/db", () => ({ db: {} }));
// Mock Stripe to avoid missing env in unit tests
jest.mock("stripe", () => jest.fn());

import { verifyRazorpayWebhook } from "@/lib/services/payment";

describe("verifyRazorpayWebhook", () => {
  const secret = "test_webhook_secret";
  const payload = JSON.stringify({ event: "payment.captured", payload: {} });

  beforeEach(() => {
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;
  });

  it("returns true for valid signature", () => {
    const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    expect(verifyRazorpayWebhook(payload, sig)).toBe(true);
  });

  it("returns false for wrong signature", () => {
    expect(verifyRazorpayWebhook(payload, "deadbeef")).toBe(false);
  });

  it("returns false when secret not set", () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    expect(verifyRazorpayWebhook(payload, sig)).toBe(false);
  });
});
