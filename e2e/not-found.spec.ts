import { test, expect } from "@playwright/test";

test.describe("404 page", () => {
  test("renders 404 message and navigation links", async ({ page }) => {
    await page.goto("/nonexistent-page");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(
      page.getByText(/the page you're looking for doesn't exist/i)
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /home/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /search/i })).toBeVisible();
  });

  test("Home link navigates to root", async ({ page }) => {
    await page.goto("/nonexistent-page");
    await page.getByRole("link", { name: /home/i }).click();
    await expect(page).toHaveURL("/");
  });
});
