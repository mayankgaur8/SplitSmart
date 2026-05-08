import { signupSchema, createExpenseSchema, paginationSchema } from "@/lib/validations";

describe("signupSchema", () => {
  const valid = { name: "Alice", email: "alice@example.com", password: "Secret123" };

  it("accepts valid input", () => {
    expect(() => signupSchema.parse(valid)).not.toThrow();
  });

  it("rejects short password", () => {
    expect(() => signupSchema.parse({ ...valid, password: "abc" })).toThrow();
  });

  it("rejects password without uppercase", () => {
    expect(() => signupSchema.parse({ ...valid, password: "secret123" })).toThrow();
  });

  it("rejects password without number", () => {
    expect(() => signupSchema.parse({ ...valid, password: "SecretABC" })).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() => signupSchema.parse({ ...valid, email: "not-an-email" })).toThrow();
  });
});

describe("paginationSchema", () => {
  it("coerces string page to number", () => {
    const result = paginationSchema.parse({ page: "2", limit: "10" });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });

  it("defaults to page 1, limit 20", () => {
    const result = paginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("rejects limit > 100", () => {
    expect(() => paginationSchema.parse({ limit: "200" })).toThrow();
  });
});

describe("createExpenseSchema", () => {
  const valid = {
    groupId: "clxxxxxxxxxxxxxxxxxxxxxx",
    title: "Dinner",
    amount: 600,
    category: "FOOD",
    splitType: "EQUAL",
    paidById: "clxxxxxxxxxxxxxxxxxxxxxx",
    splits: [],
  };

  it("accepts valid expense", () => {
    expect(() => createExpenseSchema.parse(valid)).not.toThrow();
  });

  it("rejects negative amount", () => {
    expect(() => createExpenseSchema.parse({ ...valid, amount: -10 })).toThrow();
  });

  it("rejects empty title", () => {
    expect(() => createExpenseSchema.parse({ ...valid, title: "" })).toThrow();
  });
});
