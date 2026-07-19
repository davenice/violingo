import { chromium } from "playwright";
import fs from "node:fs";

const shotDir = ".e2e";
const EMAIL = `test-${Date.now()}@example.com`;
const PROJECT = "violingo-rules-test";
let shotN = 0;

fs.mkdirSync(shotDir, { recursive: true });

async function shot(page, label) {
  shotN += 1;
  const path = `${shotDir}/${String(shotN).padStart(2, "0")}-${label}.png`;
  await page.screenshot({ path });
  console.log(`SCREENSHOT ${path}`);
}

async function getLatestOobLink(email) {
  const res = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/oobCodes`);
  const json = await res.json();
  const codes = (json.oobCodes ?? []).filter((c) => c.email === email);
  if (codes.length === 0) throw new Error("No oob codes found for " + email);
  return codes[codes.length - 1].oobLink;
}

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(String(err)));

const results = [];
function record(step, ok, detail = "") {
  results.push({ step, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}: ${step}${detail ? " — " + detail : ""}`);
}

try {
  // 1. Root redirects to /login
  await page.goto("http://localhost:3000/");
  await page.waitForURL("**/login", { timeout: 10000 });
  record("1. root redirects to /login", true);
  await shot(page, "login-screen");

  // 2. Request sign-in link
  await page.getByPlaceholder("you@example.com").fill(EMAIL);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await page.waitForSelector("text=Check your email", { timeout: 10000 });
  record("2. submit email shows 'Check your email'", true);

  // 3. Fetch oob link from Auth emulator
  const oobLink = await getLatestOobLink(EMAIL);
  record("3. fetched oobLink from Auth emulator", true);

  // 4. Navigate to link -> completes sign-in -> onboarding
  await page.goto(oobLink);
  await page.waitForURL("**/onboarding", { timeout: 15000 });
  record("4. sign-in link completes auth, redirects to /onboarding", true);
  await shot(page, "onboarding-screen");

  // 5. Fill onboarding form
  await page.getByLabel("Child's name").fill("Junior");
  await page.getByLabel(/Parent PIN/).fill("1234");
  await page.getByRole("button", { name: "Start practicing" }).click();
  await page.waitForURL("http://localhost:3000/", { timeout: 15000 });
  record("5. onboarding creates profile, redirects to /", true);

  // 6. Child home shows greeting
  await page.waitForSelector("text=Hi Junior!", { timeout: 10000 });
  record("6. child home shows 'Hi Junior!'", true);
  await shot(page, "child-home");

  // 7. Click Parent settings -> PIN gate
  await page.getByRole("link", { name: "Parent settings" }).click();
  await page.waitForSelector("text=Enter parent PIN", { timeout: 10000 });
  record("7. Parent settings link shows PIN gate", true);
  await shot(page, "pin-gate");

  // 8. Wrong PIN
  await page.locator('input[inputmode="numeric"]').fill("0000");
  await page.getByRole("button", { name: "Unlock" }).click();
  await page.waitForSelector("text=Incorrect PIN", { timeout: 10000 });
  record("8. wrong PIN shows 'Incorrect PIN'", true);

  // 9. Correct PIN
  await page.locator('input[inputmode="numeric"]').fill("1234");
  await page.getByRole("button", { name: "Unlock" }).click();
  await page.waitForSelector("text=Parent settings", { timeout: 10000 });
  await page.waitForSelector("text=Settings for", { timeout: 10000 });
  record("9. correct PIN unlocks parent dashboard", true);
  await shot(page, "parent-dashboard");

  // 10. Back to child view
  await page.getByRole("button", { name: "Back to child view" }).click();
  await page.waitForSelector("text=Hi Junior!", { timeout: 10000 });
  record("10. Back to child view returns to child home", true);

  // 11. Reload persists session
  await page.reload();
  await page.waitForSelector("text=Hi Junior!", { timeout: 10000 });
  record("11. reload persists session (still on child home)", true);
  await shot(page, "after-reload");
} catch (err) {
  record("EXCEPTION", false, String(err));
  await shot(page, "failure");
} finally {
  console.log("\n--- console errors ---");
  console.log(consoleErrors.length ? consoleErrors.join("\n") : "(none)");
  fs.writeFileSync(`${shotDir}/results.json`, JSON.stringify(results, null, 2));
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
process.exit(failed.length ? 1 : 0);
