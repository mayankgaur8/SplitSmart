import { canUseFeature, isWithinLimit, getLimit } from "@/lib/services/plan";

describe("canUseFeature", () => {
  it("FREE plan cannot use AI insights", () => {
    expect(canUseFeature("FREE", "ACTIVE", "aiInsights")).toBe(false);
  });

  it("PRO plan can use AI insights", () => {
    expect(canUseFeature("PRO", "ACTIVE", "aiInsights")).toBe(true);
  });

  it("CANCELLED plan falls back to FREE limits", () => {
    expect(canUseFeature("PRO", "CANCELLED", "aiInsights")).toBe(false);
  });

  it("TEAM plan can use export reports", () => {
    expect(canUseFeature("TEAM", "ACTIVE", "exportReports")).toBe(true);
  });

  it("PRO plan cannot use export reports", () => {
    expect(canUseFeature("PRO", "ACTIVE", "exportReports")).toBe(false);
  });
});

describe("isWithinLimit", () => {
  it("FREE plan: within 3 groups", () => {
    expect(isWithinLimit("FREE", "ACTIVE", "maxGroups", 2)).toBe(true);
  });

  it("FREE plan: at group limit", () => {
    expect(isWithinLimit("FREE", "ACTIVE", "maxGroups", 3)).toBe(false);
  });

  it("PRO plan: unlimited groups", () => {
    expect(isWithinLimit("PRO", "ACTIVE", "maxGroups", 999)).toBe(true);
  });

  it("expired PRO plan falls back to FREE", () => {
    expect(isWithinLimit("PRO", "EXPIRED", "maxGroups", 3)).toBe(false);
  });
});

describe("getLimit", () => {
  it("FREE maxExpensesPerMonth is 30", () => {
    expect(getLimit("FREE", "ACTIVE", "maxExpensesPerMonth")).toBe(30);
  });

  it("PRO maxExpensesPerMonth is Infinity", () => {
    expect(getLimit("PRO", "ACTIVE", "maxExpensesPerMonth")).toBe(Infinity);
  });
});
