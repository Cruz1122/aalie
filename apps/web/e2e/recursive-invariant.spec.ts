import { test, expect, Page } from "@playwright/test";

test.describe("Recursive Invariant E2E Tests", () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    // Navigate to analyzer (adjust URL based on your deployment)
    await page.goto("http://localhost:3000/en/analyzer");
    // Wait for app to load
    await page.waitForSelector('[data-testid="code-editor"]', {
      timeout: 10000,
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test("should display recursive invariant for Fibonacci", async () => {
    // Input Fibonacci algorithm
    const fibonacciCode = `
FUNCTION fib(n)
BEGIN
  IF n <= 1 THEN
    RETURN 1
  ELSE
    RETURN fib(n-1) + fib(n-2)
  END
END
    `;

    // Insert code into editor
    await page.fill('[data-testid="code-editor"]', fibonacciCode);

    // Trigger analysis
    await page.click('[data-testid="analyze-button"]');

    // Wait for analysis results
    await page.waitForSelector('[data-testid="analysis-results"]', {
      timeout: 15000,
    });

    // Since Fibonacci is recursive, should show recursive invariant button (not loop invariant)
    const recursiveInvariantButton = page.locator(
      'button:has-text("View recursive invariant")',
    );
    await expect(recursiveInvariantButton).toBeVisible();

    // Click to open modal
    await recursiveInvariantButton.click();

    // Verify modal appears
    const modal = page.locator('[data-testid="recursive-invariant-modal"]');
    await expect(modal).toBeVisible();

    // Verify status badge shows ok or low_confidence
    const statusBadge = modal.locator('[data-testid="status-badge"]');
    const status = await statusBadge.textContent();
    expect(["Well-supported", "Partially supported"]).toContain(status);

    // Verify 4 sections are visible
    await expect(
      modal.locator('[data-testid="section-base-property"]'),
    ).toBeVisible();
    await expect(
      modal.locator('[data-testid="section-inductive-hypothesis"]'),
    ).toBeVisible();
    await expect(
      modal.locator('[data-testid="section-recursive-step"]'),
    ).toBeVisible();
    await expect(
      modal.locator('[data-testid="section-termination-guarantee"]'),
    ).toBeVisible();

    // Verify recursive structure shows 2 calls
    const recursiveCallsText = await modal
      .locator('[data-testid="recursive-calls"]')
      .textContent();
    expect(recursiveCallsText).toContain("fib");

    // Verify recursion type is "Multiple Recursion"
    const recursionTypeElement = modal.locator(
      '[data-testid="recursion-type"]',
    );
    await expect(recursionTypeElement).toContainText("Multiple Recursion");

    // Close modal
    await modal.locator('[data-testid="close-button"]').click();
    await expect(modal).not.toBeVisible();
  });

  test("should display recursive invariant for Binary Search", async () => {
    // Input Binary Search algorithm
    const binarySearchCode = `
FUNCTION busquedaBinaria(A, x, inicio, fin)
BEGIN
  IF inicio > fin THEN
    RETURN -1
  END
  
  mitad = (inicio + fin) / 2
  
  IF A[mitad] = x THEN
    RETURN mitad
  ELSE IF x < A[mitad] THEN
    RETURN busquedaBinaria(A, x, inicio, mitad - 1)
  ELSE
    RETURN busquedaBinaria(A, x, mitad + 1, fin)
  END
END
    `;

    await page.fill('[data-testid="code-editor"]', binarySearchCode);
    await page.click('[data-testid="analyze-button"]');
    await page.waitForSelector('[data-testid="analysis-results"]', {
      timeout: 15000,
    });

    // Open recursive invariant modal
    const recursiveInvariantButton = page.locator(
      'button:has-text("View recursive invariant")',
    );
    await expect(recursiveInvariantButton).toBeVisible();
    await recursiveInvariantButton.click();

    const modal = page.locator('[data-testid="recursive-invariant-modal"]');
    await expect(modal).toBeVisible();

    // Verify recursion type is "Divide-and-Conquer" (NOT Multiple)
    const recursionTypeElement = modal.locator(
      '[data-testid="recursion-type"]',
    );
    await expect(recursionTypeElement).toContainText("Divide-and-Conquer");

    // Verify base result shows "-1"
    const baseResultText = await modal
      .locator('[data-testid="base-result"]')
      .textContent();
    expect(baseResultText).toContain("-1");

    // Verify base condition shows "inicio > fin"
    const baseConditionText = await modal
      .locator('[data-testid="base-condition"]')
      .textContent();
    expect(baseConditionText).toContain("inicio > fin");
  });

  test("should display recursive invariant for Linear Recursion", async () => {
    // Input Countdown algorithm
    const countdownCode = `
FUNCTION countdown(n)
BEGIN
  IF n = 0 THEN
    RETURN 0
  ELSE
    RETURN countdown(n - 1)
  END
END
    `;

    await page.fill('[data-testid="code-editor"]', countdownCode);
    await page.click('[data-testid="analyze-button"]');
    await page.waitForSelector('[data-testid="analysis-results"]', {
      timeout: 15000,
    });

    const recursiveInvariantButton = page.locator(
      'button:has-text("View recursive invariant")',
    );
    await expect(recursiveInvariantButton).toBeVisible();
    await recursiveInvariantButton.click();

    const modal = page.locator('[data-testid="recursive-invariant-modal"]');
    await expect(modal).toBeVisible();

    // Verify recursion type is "Linear Recursion"
    const recursionTypeElement = modal.locator(
      '[data-testid="recursion-type"]',
    );
    await expect(recursionTypeElement).toContainText("Linear Recursion");

    // Verify didactic summary mentions linear pattern
    const summary = await modal
      .locator('[data-testid="didactic-summary"]')
      .textContent();
    expect(summary?.toLowerCase()).toContain("single");
  });

  test("should show unavailable for non-recursive algorithm", async () => {
    // Input iterative algorithm
    const iterativeCode = `
FUNCTION iterativeSum(n)
BEGIN
  sum = 0
  FOR i = 1 TO n DO
    sum = sum + i
  END
  RETURN sum
END
    `;

    await page.fill('[data-testid="code-editor"]', iterativeCode);
    await page.click('[data-testid="analyze-button"]');
    await page.waitForSelector('[data-testid="analysis-results"]', {
      timeout: 15000,
    });

    // Should show loop invariant button, NOT recursive invariant
    const loopInvariantButton = page.locator(
      'button:has-text("View loop invariant")',
    );
    await expect(loopInvariantButton).toBeVisible();

    const recursiveInvariantButton = page.locator(
      'button:has-text("View recursive invariant")',
    );
    // Should not be visible or should be disabled
    const isDisabledOrHidden =
      (await recursiveInvariantButton.isHidden()) ||
      (await recursiveInvariantButton.isDisabled());
    expect(isDisabledOrHidden).toBeTruthy();
  });

  test("should support Spanish locale", async () => {
    // Navigate to Spanish version
    await page.goto("http://localhost:3000/es/analyzer");
    await page.waitForSelector('[data-testid="code-editor"]', {
      timeout: 10000,
    });

    const fibonacciCode = `
FUNCTION fib(n)
BEGIN
  IF n <= 1 THEN
    RETURN 1
  ELSE
    RETURN fib(n-1) + fib(n-2)
  END
END
    `;

    await page.fill('[data-testid="code-editor"]', fibonacciCode);
    await page.click('[data-testid="analyze-button"]');
    await page.waitForSelector('[data-testid="analysis-results"]', {
      timeout: 15000,
    });

    // Spanish button text
    const recursiveInvariantButton = page.locator(
      'button:has-text("Ver invariante recursivo")',
    );
    await expect(recursiveInvariantButton).toBeVisible();
    await recursiveInvariantButton.click();

    const modal = page.locator('[data-testid="recursive-invariant-modal"]');
    await expect(modal).toBeVisible();

    // Verify Spanish labels
    const titleText = await modal
      .locator('[data-testid="modal-title"]')
      .textContent();
    expect(titleText).toContain("Invariante Recursivo");

    // Verify Spanish section names
    await expect(
      modal.locator('[data-testid="section-base-property"]'),
    ).toContainText("Propiedad del Caso Base");
  });

  test("should show confidence score", async () => {
    const fibonacciCode = `
FUNCTION fib(n)
BEGIN
  IF n <= 1 THEN
    RETURN 1
  ELSE
    RETURN fib(n-1) + fib(n-2)
  END
END
    `;

    await page.fill('[data-testid="code-editor"]', fibonacciCode);
    await page.click('[data-testid="analyze-button"]');
    await page.waitForSelector('[data-testid="analysis-results"]', {
      timeout: 15000,
    });

    const recursiveInvariantButton = page.locator(
      'button:has-text("View recursive invariant")',
    );
    await recursiveInvariantButton.click();

    const modal = page.locator('[data-testid="recursive-invariant-modal"]');

    // Verify confidence is shown as percentage
    const confidenceText = await modal
      .locator('[data-testid="confidence-score"]')
      .textContent();
    expect(confidenceText).toMatch(/\d+%/);

    // Extract and verify percentage is between 0-100
    const percentage = parseInt(confidenceText?.match(/(\d+)%/)?.[1] || "0");
    expect(percentage).toBeGreaterThanOrEqual(0);
    expect(percentage).toBeLessThanOrEqual(100);
  });

  test("should close modal with X button", async () => {
    const fibonacciCode = `
FUNCTION fib(n)
BEGIN
  IF n <= 1 THEN
    RETURN 1
  ELSE
    RETURN fib(n-1) + fib(n-2)
  END
END
    `;

    await page.fill('[data-testid="code-editor"]', fibonacciCode);
    await page.click('[data-testid="analyze-button"]');
    await page.waitForSelector('[data-testid="analysis-results"]', {
      timeout: 15000,
    });

    const recursiveInvariantButton = page.locator(
      'button:has-text("View recursive invariant")',
    );
    await recursiveInvariantButton.click();

    const modal = page.locator('[data-testid="recursive-invariant-modal"]');
    await expect(modal).toBeVisible();

    // Click close button
    await modal.locator('[data-testid="close-button"]').click();
    await expect(modal).not.toBeVisible();
  });

  test("should close modal when clicking outside", async () => {
    const fibonacciCode = `
FUNCTION fib(n)
BEGIN
  IF n <= 1 THEN
    RETURN 1
  ELSE
    RETURN fib(n-1) + fib(n-2)
  END
END
    `;

    await page.fill('[data-testid="code-editor"]', fibonacciCode);
    await page.click('[data-testid="analyze-button"]');
    await page.waitForSelector('[data-testid="analysis-results"]', {
      timeout: 15000,
    });

    const recursiveInvariantButton = page.locator(
      'button:has-text("View recursive invariant")',
    );
    await recursiveInvariantButton.click();

    const modal = page.locator('[data-testid="recursive-invariant-modal"]');
    await expect(modal).toBeVisible();

    // Click outside modal (on backdrop)
    await page.click('[data-testid="modal-backdrop"]');
    await expect(modal).not.toBeVisible();
  });

  test("should display evidence section with base conditions", async () => {
    const fibonacciCode = `
FUNCTION fib(n)
BEGIN
  IF n <= 1 THEN
    RETURN 1
  ELSE
    RETURN fib(n-1) + fib(n-2)
  END
END
    `;

    await page.fill('[data-testid="code-editor"]', fibonacciCode);
    await page.click('[data-testid="analyze-button"]');
    await page.waitForSelector('[data-testid="analysis-results"]', {
      timeout: 15000,
    });

    const recursiveInvariantButton = page.locator(
      'button:has-text("View recursive invariant")',
    );
    await recursiveInvariantButton.click();

    const modal = page.locator('[data-testid="recursive-invariant-modal"]');

    // Expand evidence details
    const detailsElement = modal.locator("details");
    await detailsElement.click();

    // Verify evidence section shows
    const evidenceSection = modal.locator('[data-testid="evidence-section"]');
    await expect(evidenceSection).toBeVisible();

    // Verify base conditions are listed
    const baseConditionsText = await modal
      .locator('[data-testid="base-conditions-list"]')
      .textContent();
    expect(baseConditionsText).toContain("n <= 1");
  });
});
