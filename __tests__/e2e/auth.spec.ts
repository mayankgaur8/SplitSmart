import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("Authentication", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/SplitSmart/i);
  });

  test("redirects unauthenticated user to /login from /dashboard", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/login/);
  });

  test("signup form renders", async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("login form renders", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("shows error on invalid login", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill("input[type='email']", "notreal@example.com");
    await page.fill("input[type='password']", "WrongPass1");
    await page.click("button[type='submit']");
    // Expect some error to appear (toast or inline)
    await expect(page.locator("body")).toContainText(/invalid|incorrect|error/i, { timeout: 5000 });
  });
});

test.describe("API health", () => {
  test("GET /api/health returns 200", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toMatch(/healthy|degraded/);
  });

  test("GET /api/groups without auth returns 401", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/groups`);
    expect(res.status()).toBe(401);
  });
});
