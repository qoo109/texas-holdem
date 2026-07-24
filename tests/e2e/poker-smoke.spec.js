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

  const sideRail = page.locator(".side-rail");
  await page.locator("#layoutButton").click();
  await expect(page.locator("#layoutEditorPanel")).toBeVisible();
  await expect(sideRail).toHaveClass(/is-layout-editor-active/);
  await expect(page.locator("#coachPanel")).toBeHidden();
  await expect(page.locator("#historyPanel")).toBeHidden();
  await expect(page.locator("#layoutSizeControls")).toBeVisible();
  await expect(page.locator("[data-layout-size]")).toHaveCount(6);
  await expect(page.locator("[data-layout-size='potScale']")).toHaveValue("100");
  await page.locator("[data-layout-size='aiProfile']").scrollIntoViewIfNeeded();
  await expect(page.locator("[data-layout-size='aiProfile']")).toBeInViewport();

  const pot = page.locator('[data-layout-key="pot"]');
  await pot.click();
  await expect(pot.locator(":scope > .layout-resize-handle")).toHaveCount(4);
  await expect(page.locator("#layoutStatus")).toContainText("拖曳四角調整大小");

  const startPotScale = await page.evaluate(() => LayoutCornerResize.getPotScale());
  const resizeHandle = pot.locator('[data-layout-resize-handle="se"]');
  const handleBox = await resizeHandle.boundingBox();
  expect(handleBox).not.toBeNull();
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2 + 36, handleBox.y + handleBox.height / 2 + 20, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => LayoutCornerResize.getPotScale())).toBeGreaterThan(startPotScale);
  await expect.poll(() => page.locator("[data-layout-size='potScale']").inputValue()).not.toBe("100");

  await page.locator("#layoutButton").click();
  await expect(page.locator("#layoutEditorPanel")).toBeHidden();
  await expect(sideRail).not.toHaveClass(/is-layout-editor-active/);
  await expect(page.locator("#coachPanel")).toBeVisible();
  await expect(page.locator("#historyPanel")).toBeVisible();

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
