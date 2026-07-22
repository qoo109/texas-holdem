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

async function openFreshTable(page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("#arena")).toBeVisible();
  await expect(page.locator("#playerCards .card")).toHaveCount(2);
}

async function waitForHumanAction(page, selector) {
  const button = page.locator(selector);
  await expect(button).toBeEnabled({ timeout: 30_000 });
  return button;
}

test("玩家加注會扣除籌碼並寫入牌局紀錄", async ({ page }) => {
  const runtimeIssues = collectRuntimeIssues(page);
  await openFreshTable(page);

  const raiseButton = await waitForHumanAction(page, "#raiseButton");
  const stackBefore = Number(await page.locator("#playerStack").textContent());
  const raiseAmount = page.locator("#raiseAmount");

  await raiseAmount.evaluate(input => {
    input.value = input.min;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await raiseButton.click();

  await expect.poll(
    async () => Number(await page.locator("#playerStack").textContent()),
    { timeout: 5_000 },
  ).toBeLessThan(stackBefore);

  await expect(page.locator("#gameLog")).toContainText(/Owl (加注|All-in 加注)/, { timeout: 5_000 });

  await page.waitForTimeout(300);
  expect(runtimeIssues, runtimeIssues.join("\n")).toEqual([]);
});

test("玩家 All-in 會清空可用籌碼並寫入牌局紀錄", async ({ page }) => {
  const runtimeIssues = collectRuntimeIssues(page);
  await openFreshTable(page);

  const allInButton = await waitForHumanAction(page, "#allInButton");
  const stackBefore = Number(await page.locator("#playerStack").textContent());
  expect(stackBefore).toBeGreaterThan(0);

  await allInButton.click();

  await expect.poll(
    async () => Number(await page.locator("#playerStack").textContent()),
    { timeout: 2_000 },
  ).toBe(0);

  await expect(page.locator("#gameLog")).toContainText(/Owl All-in/, { timeout: 5_000 });

  await page.waitForTimeout(300);
  expect(runtimeIssues, runtimeIssues.join("\n")).toEqual([]);
});
