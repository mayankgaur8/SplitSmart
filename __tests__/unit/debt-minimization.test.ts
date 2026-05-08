import { calculateDebtMinimization } from "@/lib/utils";

describe("calculateDebtMinimization", () => {
  it("returns empty array for no debts", () => {
    expect(calculateDebtMinimization([])).toEqual([]);
  });

  it("handles a simple two-person debt", () => {
    const result = calculateDebtMinimization([{ from: "alice", to: "bob", amount: 100 }]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ from: "alice", to: "bob", amount: 100 });
  });

  it("cancels out circular debts to zero", () => {
    // alice → bob 30, bob → alice 30 → net zero
    const result = calculateDebtMinimization([
      { from: "alice", to: "bob", amount: 30 },
      { from: "bob", to: "alice", amount: 30 },
    ]);
    expect(result).toHaveLength(0);
  });

  it("reduces three raw debts to fewer transactions", () => {
    // alice → bob 30, bob → charlie 30, charlie → alice 30 → all net zero
    const result = calculateDebtMinimization([
      { from: "alice", to: "bob", amount: 30 },
      { from: "bob", to: "charlie", amount: 30 },
      { from: "charlie", to: "alice", amount: 30 },
    ]);
    expect(result).toHaveLength(0);
  });

  it("all amounts are positive", () => {
    const result = calculateDebtMinimization([
      { from: "x", to: "y", amount: 50 },
      { from: "z", to: "x", amount: 20 },
    ]);
    result.forEach((t) => expect(t.amount).toBeGreaterThan(0));
  });
});
