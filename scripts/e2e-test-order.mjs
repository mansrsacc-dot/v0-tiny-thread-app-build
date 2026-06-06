/**
 * TinyThread E2E test order — final version
 * All selectors verified from page source and screenshots.
 */
import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SS = path.join(ROOT, "e2e-screenshots");
fs.mkdirSync(SS, { recursive: true });
for (const f of fs.readdirSync(SS)) fs.unlinkSync(path.join(SS, f));

let n = 0;
async function ss(page, label) {
  const file = path.join(SS, `${String(++n).padStart(2,"0")}-${label}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${path.basename(file)}`);
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);

  try {
    // ─── 1. Load app ─────────────────────────────────────────────────────────
    console.log("\n[1] Loading https://app.tinythread.lv");
    await page.goto("https://app.tinythread.lv", { waitUntil: "domcontentloaded", timeout: 30000 });
    await wait(2500);
    await ss(page, "01-initial");

    // ─── 2. Dismiss welcome guide (Izlaist = Skip) ────────────────────────────
    console.log("\n[2] Dismissing guide modal");
    const izlaist = page.getByText("Izlaist", { exact: true });
    if (await izlaist.isVisible({ timeout: 5000 }).catch(() => false)) {
      await izlaist.click();
      console.log("  ✓ Izlaist clicked");
      await wait(700);
    }
    await ss(page, "02-guide-dismissed");

    // ─── 3. Select size L (button contains "150-250" in its text) ────────────
    console.log("\n[3] Selecting size L");
    // L button renders: <div>L</div><div>150-250mm</div>
    // Filter by presence of "150-250" text inside
    const lBtn = page.locator("button").filter({ hasText: "150-250" }).first();
    await lBtn.click({ timeout: 8000 });
    console.log("  ✓ Size L selected");
    await wait(400);

    // ─── 4. Select Car style — scroll to it and click exact text ─────────────
    console.log("\n[4] Selecting Mašīnas izšuvums");
    // Scroll to make the STILS section visible
    const stils = page.getByText("STILS", { exact: true }).first();
    await stils.scrollIntoViewIfNeeded().catch(() => {});
    await wait(400);

    // Click the exact text label of the Car style card
    // getByText({ exact: true }) matches the element whose text is EXACTLY this
    // The click bubbles up to the card's onClick → handleStyleChange("car")
    const carText = page.getByText("Mašīnas izšuvums", { exact: true }).first();
    await carText.scrollIntoViewIfNeeded();
    await wait(300);
    await carText.click({ timeout: 8000 });
    console.log("  ✓ Clicked Mašīnas izšuvums");
    await wait(600);
    await ss(page, "03-car-selected");

    // Verify Car is selected (check the status bar or design layer)
    const statusBar = await page.locator("text=Mašīnas izšuvums").count();
    console.log(`  Car style mentions on page: ${statusBar}`);

    // ─── 5. Upload test image ─────────────────────────────────────────────────
    console.log("\n[5] Uploading test image");
    const testImg = path.join(ROOT, "test-upload.png");
    // Force-set on the (possibly hidden) file input
    await page.locator('input[type="file"]').first().setInputFiles(testImg);
    console.log("  ✓ File set");
    await wait(2000);
    await ss(page, "04-after-upload");

    // ─── 6. License plate modal → Nē ─────────────────────────────────────────
    console.log("\n[6] License plate modal check");
    // "Nē" is the No button for the license plate question
    const noeText = page.getByText("Nē", { exact: true });
    if (await noeText.isVisible({ timeout: 6000 }).catch(() => false)) {
      await noeText.click();
      console.log("  ✓ Clicked Nē");
      await wait(500);
    } else {
      console.log("  ℹ No license plate modal");
    }

    // ─── 7. Wait for Replicate generation ────────────────────────────────────
    console.log("\n[7] Waiting for generation");
    const t0 = Date.now();
    while (Date.now() - t0 < 60000) {
      const txt = await page.innerText("body").catch(() => "");
      if (!txt.match(/ģenerē izšuvumu|generating/i)) break;
      process.stdout.write(".");
      await wait(2000);
    }
    console.log(`\n  ⏱ ${Math.round((Date.now() - t0) / 1000)}s`);
    await wait(2000);
    await ss(page, "05-after-generation");

    // Show what design layer shows
    const designLayer = await page.locator(".dizaina-slani, [class*='layer']").first().innerText().catch(() => "");
    const statusText = await page.locator(".bottom-bar, [class*='status']").first().innerText().catch(() => "n/a");
    console.log("  Status/design info:", statusText);

    // ─── 8. Switch to Aizmugure (back) ───────────────────────────────────────
    console.log("\n[8] Switching to Aizmugure (back)");
    const aizmugureBtn = page.getByRole("button", { name: "Aizmugure" }).first();
    if (await aizmugureBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await aizmugureBtn.click();
      console.log("  ✓ Clicked Aizmugure");
    } else {
      // Scroll up and try again
      await page.evaluate(() => window.scrollTo(0, 0));
      await wait(300);
      await page.getByText("Aizmugure", { exact: true }).first().click({ timeout: 5000 });
      console.log("  ✓ Clicked Aizmugure (text)");
    }
    await wait(700);
    await ss(page, "06-back-view");

    // ─── 9. Open text modal ───────────────────────────────────────────────────
    console.log("\n[9] Opening text modal");
    // Button says "≡ Pievienot tekstu (+€12)"
    const addTextBtn = page.getByText(/pievienot tekstu/i).first();
    await addTextBtn.scrollIntoViewIfNeeded();
    await addTextBtn.click({ timeout: 8000 });
    console.log("  ✓ Clicked Pievienot tekstu");
    await wait(800);
    await ss(page, "07-text-modal");

    // ─── 10. Type "TEST" into textarea ────────────────────────────────────────
    console.log("\n[10] Typing TEST in textarea");
    // The text modal uses a <textarea>, not an <input>
    const textarea = page.locator("textarea").first();
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textarea.click();
      await textarea.fill("TEST");
      console.log("  ✓ Typed TEST in textarea");
    } else {
      // Try placeholder-based
      const taAlt = page.locator('[placeholder*="tekstu"], [placeholder*="text"]').first();
      if (await taAlt.isVisible({ timeout: 3000 }).catch(() => false)) {
        await taAlt.fill("TEST");
        console.log("  ✓ Typed TEST (placeholder)");
      }
    }
    await wait(400);
    await ss(page, "08-text-typed");

    // ─── 11. Submit text modal ────────────────────────────────────────────────
    console.log("\n[11] Submitting text");
    // The submit button says "Pievienot tekstu (+€12)"
    const addTextSubmit = page.getByRole("button", { name: /pievienot tekstu/i }).last();
    if (await addTextSubmit.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addTextSubmit.click();
      console.log("  ✓ Clicked Pievienot tekstu (submit)");
    } else {
      // Fallback: button[type=submit]
      const sub = page.locator("button[type='submit']").first();
      if (await sub.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sub.click();
        console.log("  ✓ Clicked submit button");
      }
    }
    await wait(700);
    await ss(page, "09-text-added");

    // ─── 12. Click Pievienot grozam ───────────────────────────────────────────
    console.log("\n[12] Clicking Pievienot grozam");
    const cartBtn = page.locator("button").filter({ hasText: /pievienot grozam/i }).first();
    const cartLabel = await cartBtn.innerText().catch(() => "?");
    console.log(`  Button: "${cartLabel}"`);
    await cartBtn.scrollIntoViewIfNeeded();
    await ss(page, "10-before-cart");
    await cartBtn.click({ timeout: 10000 });
    console.log("  ✓ Clicked add to cart");

    // App shows a "Vai esi pabeidzis?" confirmation modal — click "Jā, pievienot grozam"
    console.log("  ⏳ Waiting for confirmation modal...");
    await wait(4000);
    const confirmBtn = page.getByRole("button", { name: /jā, pievienot grozam/i });
    if (await confirmBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await confirmBtn.click();
      console.log("  ✓ Clicked 'Jā, pievienot grozam' (confirmation)");
    } else {
      // Also try text match
      const jaBtn = page.getByText(/jā, pievienot grozam/i).first();
      if (await jaBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await jaBtn.click();
        console.log("  ✓ Clicked Jā (text match)");
      }
    }

    console.log("  ⏳ Waiting for cart processing (screenshots + Shopify redirect)...");
    await wait(12000);
    await ss(page, "11-after-cart");
    console.log("  URL:", page.url());

    // ─── 13. Navigate to Shopify checkout ────────────────────────────────────
    console.log("\n[13] Navigating to checkout");

    // Find the active page (may have navigated to tinythread.lv)
    let chk = ctx.pages().find(p => p.url().includes("checkout")) || null;
    const shopifyStorePg = ctx.pages().find(p => p.url().includes("tinythread.lv")) || page;
    await shopifyStorePg.bringToFront();
    await wait(2000);
    console.log("  Active page URL:", shopifyStorePg.url());
    await shopifyStorePg.screenshot({ path: path.join(SS, `${String(++n).padStart(2,"0")}-12-shopify-store.png`) });
    console.log(`  📸 12-shopify-store.png`);

    // Handle cookie consent (click Accept or Decline)
    const cookieAccept = shopifyStorePg.locator("button").filter({ hasText: /accept|decline/i }).first();
    if (await cookieAccept.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieAccept.click();
      console.log("  ✓ Dismissed cookie consent");
      await wait(500);
    }

    // Click "Uz kasi →" (To checkout) button in the success modal
    const uzKasiBtn = shopifyStorePg.getByText(/uz kasi/i).first();
    if (await uzKasiBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uzKasiBtn.click();
      console.log("  ✓ Clicked Uz kasi (to checkout)");
      await wait(8000);
    } else {
      // Try direct checkout URL
      await shopifyStorePg.goto("https://tinythread.lv/checkout", { waitUntil: "domcontentloaded", timeout: 20000 });
      await wait(5000);
    }

    // Find checkout page
    chk = ctx.pages().find(p => p.url().includes("checkout")) || shopifyStorePg;
    await chk.bringToFront();
    await wait(3000);
    console.log("  Checkout URL:", chk.url());
    await chk.screenshot({ path: path.join(SS, `${String(++n).padStart(2,"0")}-13-checkout.png`) });
    console.log(`  📸 13-checkout.png`);

    // ─── 13b. If on cart page, click the checkout button ─────────────────────
    if (chk.url().includes("/cart")) {
      console.log("\n[13b] On cart page — clicking checkout button");
      // Shopify cart page has "APSKATIET" or "Checkout" button
      const checkoutBtns = [
        chk.getByText(/apskatiet|checkout/i).first(),
        chk.locator('button, a').filter({ hasText: /apskatiet|checkout/i }).first(),
        chk.locator('input[name="checkout"]').first(),
      ];
      let clicked = false;
      for (const btn of checkoutBtns) {
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await btn.click();
          console.log("  ✓ Clicked checkout button");
          clicked = true;
          break;
        }
      }
      if (!clicked) {
        // Try navigating directly
        await chk.goto("https://tinythread.lv/checkout", { waitUntil: "domcontentloaded", timeout: 20000 });
        console.log("  ✓ Navigated to /checkout directly");
      }
      await wait(7000);
      // Refresh the checkout page reference
      chk = ctx.pages().find(p => p.url().includes("checkout")) || chk;
      await chk.bringToFront();
      await wait(2000);
      await chk.screenshot({ path: path.join(SS, `${String(++n).padStart(2,"0")}-14-checkout-proper.png`) });
      console.log(`  📸 14-checkout-proper.png — ${chk.url()}`);
    }

    // ─── 14. Fill address ─────────────────────────────────────────────────────
    console.log("\n[14] Filling contact/address");
    await wait(2000);

    async function f(sel, val, lbl) {
      const el = chk.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.click(); await el.fill(val);
        console.log(`  ✓ ${lbl}`);
        return true;
      }
      return false;
    }

    await f('input[type="email"], input[name="email"]', "test@tinythread.lv", "email");
    await f('input[name="firstName"]', "Test", "firstName");
    await f('input[name="lastName"]', "User", "lastName");
    await f('input[name="address1"]', "Brīvības iela 1", "address1");
    await f('input[name="city"]', "Rīga", "city");

    const cntry = chk.locator('select[name="countryCode"], select[name="country"]').first();
    if (await cntry.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cntry.selectOption("LV");
      console.log("  ✓ country = LV");
      await wait(600);
    }

    await f('input[name="postalCode"], input[name="zip"]', "LV-1001", "postalCode");
    await f('input[type="tel"]', "+37112345678", "phone");

    await chk.screenshot({ path: path.join(SS, `${String(++n).padStart(2,"0")}-14-address.png`) });
    console.log(`  📸 14-address.png`);

    // Continue
    let sub = chk.locator('button[type="submit"]').first();
    console.log(`  Submit: "${await sub.innerText().catch(() => "?")}"`);
    await sub.click({ timeout: 10000 });
    await wait(5000);
    await chk.screenshot({ path: path.join(SS, `${String(++n).padStart(2,"0")}-15-after-contact.png`) });
    console.log(`  📸 15-after-contact.png — ${chk.url()}`);

    // Shipping continue
    sub = chk.locator('button[type="submit"]').first();
    const subTxt = await sub.innerText().catch(() => "");
    console.log(`  Shipping submit: "${subTxt}"`);
    if (subTxt && !subTxt.match(/pay|maksā/i)) {
      await sub.click({ timeout: 10000 });
      await wait(5000);
    }
    await chk.screenshot({ path: path.join(SS, `${String(++n).padStart(2,"0")}-16-payment.png`) });
    console.log(`  📸 16-payment.png — ${chk.url()}`);

    // ─── 15. Fill payment ─────────────────────────────────────────────────────
    console.log("\n[15] Filling payment details");
    await wait(3000); // let iframes fully load

    // Log all iframes
    const iframes = chk.locator("iframe");
    const ifc = await iframes.count();
    console.log(`  Iframes: ${ifc}`);
    const iframeInfo = [];
    for (let i = 0; i < Math.min(ifc, 12); i++) {
      const iname = (await iframes.nth(i).getAttribute("name").catch(() => "")) || "";
      const iid   = (await iframes.nth(i).getAttribute("id").catch(() => "")) || "";
      iframeInfo.push({ i, name: iname, id: iid });
      console.log(`    [${i}] name="${iname}" id="${iid}"`);
    }

    // Shopify Payments iframes: card-fields-number-*, card-fields-expiry-*,
    // card-fields-verification_value-*, card-fields-name-*
    // Use pressSequentially for character-by-character events that Shopify expects.

    async function fillCardIframe(namePattern, value, label) {
      const info = iframeInfo.find(x => x.name.includes(namePattern) || x.id.includes(namePattern));
      if (!info) { console.log(`  ✗ No iframe for ${label}`); return false; }
      try {
        const frame = chk.frameLocator(`iframe[name="${info.name}"]`);
        const inp = frame.locator("input").first();
        await inp.waitFor({ state: "visible", timeout: 10000 });
        await inp.click();
        await inp.pressSequentially(value, { delay: 80 });
        console.log(`  ✓ ${label} via iframe "${info.name}"`);
        await wait(500);
        return true;
      } catch (e) {
        console.log(`  ⚠ ${label} via iframe failed: ${e.message.split("\n")[0]}`);
        return false;
      }
    }

    await fillCardIframe("card-fields-number",             "4242424242424242", "card number");
    await fillCardIframe("card-fields-expiry",             "0328",             "expiry");
    await fillCardIframe("card-fields-verification_value", "111",              "CVV");
    await fillCardIframe("card-fields-name",               "Test User",        "name");

    // Fallback: direct autocomplete inputs (for themes without iframes)
    await f('input[autocomplete="cc-number"]', "4242424242424242", "card number (direct)");
    await f('input[autocomplete="cc-exp"]',    "03/28",            "expiry (direct)");
    await f('input[autocomplete="cc-csc"]',    "111",              "CVV (direct)");
    await f('input[autocomplete="cc-name"]',   "Test User",        "name (direct)");

    await chk.screenshot({ path: path.join(SS, `${String(++n).padStart(2,"0")}-17-payment-filled.png`) });
    console.log(`  📸 17-payment-filled.png`);

    // ─── 16. Submit order ─────────────────────────────────────────────────────
    console.log("\n[16] Submitting order");
    const payBtn = chk.locator('button[type="submit"]').first();
    console.log(`  Pay button: "${await payBtn.innerText().catch(() => "?")}"`);
    await payBtn.click({ timeout: 10000 });
    console.log("  ✓ Payment submitted");

    await wait(20000);
    await chk.screenshot({ path: path.join(SS, `${String(++n).padStart(2,"0")}-17-result.png`) });
    console.log(`  📸 17-result.png`);

    const finalUrl = chk.url();
    const finalText = await chk.innerText("body").catch(() => "");
    console.log("  Final URL:", finalUrl);

    let orderNumber = null;
    const om = finalText.match(/#(\d{4,6})/) || finalText.match(/order.*?(\d{4,6})/i);
    if (om) orderNumber = om[1];

    const confirmed = finalUrl.includes("thank_you") || finalUrl.includes("thank-you") || !!finalText.match(/thank you|paldies/i);
    if (confirmed) {
      console.log(`\n  ✅ ORDER CONFIRMED! #${orderNumber || "?"}`);
    } else {
      console.log("\n  ⚠ Confirmation not detected");
      console.log("  Text:", finalText.slice(0, 800));
    }

    // ─── 17. Check /sorting ───────────────────────────────────────────────────
    console.log("\n[17] Checking /sorting page (wait 10s for webhook)");
    await wait(10000);
    const sortPg = await ctx.newPage();
    await sortPg.goto("https://app.tinythread.lv/sorting", { waitUntil: "domcontentloaded", timeout: 20000 });
    await wait(2000);

    // Auth if needed
    if (await sortPg.locator('input[type="password"]').isVisible({ timeout: 2000 }).catch(() => false)) {
      await sortPg.locator('input[type="password"]').first().fill("svetkupils");
      await sortPg.keyboard.press("Enter");
      await wait(3000);
    }

    await sortPg.screenshot({ path: path.join(SS, `${String(++n).padStart(2,"0")}-18-sorting.png`) });
    console.log(`  📸 18-sorting.png`);

    const sortText = await sortPg.innerText("body").catch(() => "");
    if (sortText.match(/test user|test@tinythread/i) || (orderNumber && sortText.includes(orderNumber))) {
      console.log("  ✅ Test order visible in /sorting!");
    } else {
      console.log("  ℹ /sorting:", sortText.slice(0, 500));
    }

    console.log("\n── Screenshots ───────────────────────────────────────────────");
    for (const f of fs.readdirSync(SS).sort()) console.log(" ", f);

  } catch (err) {
    const msg = err.message.split("\n")[0];
    console.error(`\n✗ FAILED: ${msg}`);
    const ap = ctx.pages().at(-1);
    if (ap) {
      await ap.screenshot({ path: path.join(SS, `${String(++n).padStart(2,"0")}-ERROR.png`) }).catch(() => {});
      console.log(`  📸 ${n}-ERROR.png`);
    }
  } finally {
    await wait(3000);
    await browser.close();
  }
})();
