import { expect, test } from "@playwright/test";

function collectRuntimeIssues(page) {
  const issues = [];

  page.on("pageerror", error => {
    issues.push(`pageerror: ${error.message}`);
  });

  page.on("console", message => {
    if (message.type() === "error") issues.push(`console: ${message.text()}`);
  });

  page.on("requestfailed", request => {
    issues.push(`request failed: ${request.url()} (${request.failure()?.errorText || "unknown"})`);
  });

  page.on("response", response => {
    const pathname = new URL(response.url()).pathname;
    if (response.status() >= 400 && !pathname.endsWith("/favicon.ico")) {
      issues.push(`http ${response.status()}: ${response.url()}`);
    }
  });

  return issues;
}

test("核心牌局與主要面板可正常操作", async ({ page }) => {
  const runtimeIssues = collectRuntimeIssues(page);

  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page).toHaveTitle("德州撲克");
  await expect(page.locator("#arena")).toBeVisible();
  await expect(page.locator("#handNumber")).toHaveText("第 1 局");
  await expect(page.locator("#playerCards .card")).toHaveCount(2);
  await expect(page.locator("#opponents .seat")).toHaveCount(6);

  await page.locator("#newHandButton").click();
  await expect(page.locator("#handNumber")).toHaveText("第 2 局");

  await page.locator("#tutorialButton").click();
  await expect(page.locator("#tutorialOverlay")).toBeVisible();
  await page.locator("#tutorialCloseButton").click();
  await expect(page.locator("#tutorialOverlay")).toBeHidden();

  await page.locator("#layoutButton").click();
  await expect(page.locator("#layoutEditorPanel")).toBeVisible();
  await page.locator("#layoutButton").click();
  await expect(page.locator("#layoutEditorPanel")).toBeHidden();

  await page.locator("#opponents .seat").first().click();
  await expect(page.locator("#aiProfilePanel")).toBeVisible();
  await page.locator("[data-profile-close]").click();
  await expect(page.locator("#aiProfilePanel")).toBeHidden();

  const callButton = page.locator("#callButton");
  await expect(callButton).toBeEnabled({ timeout: 30_000 });
  const logBeforeAction = await page.locator("#gameLog").textContent();
  await callButton.click();
  await expect(callButton).toBeDisabled({ timeout: 5_000 });
  await expect.poll(
    () => page.locator("#gameLog").textContent(),
    { timeout: 12_000 },
  ).not.toBe(logBeforeAction);

  await page.waitForTimeout(500);
  expect(runtimeIssues, runtimeIssues.join("\n")).toEqual([]);
});
