#!/usr/bin/env node
/**
 * TinyThread Shopify Setup Script
 *
 * Does everything in one run:
 * 1. OAuth → gets a fresh Shopify Admin API access token
 * 2. Sets inventory_policy=continue + inventory_management=null on ALL variants
 * 3. Creates the "Piedurknes izšuvums / Sleeve Embroidery" product (€25) if missing
 * 4. Updates SLEEVE_PHOTO_ADDON_VARIANT_ID in app/page.tsx
 * 5. Updates SHOPIFY_ACCESS_TOKEN in Vercel env
 * 6. Writes the new token to .env.local
 * 7. Commits + pushes
 *
 * Usage:
 *   VERCEL_TOKEN=vcp_xxx node scripts/shopify-setup.mjs
 *
 * Reads SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, SHOPIFY_STORE from .env.local.
 *
 * Before running, make sure http://localhost:3333/shopify/callback is added
 * to your Shopify app's Allowed Redirect URLs (Partner Dashboard or Develop Apps).
 */

import http from "http";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── Load .env.local ──────────────────────────────────────────────────────────
function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!existsSync(envPath)) return {};
  const out = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}
const envLocal = loadEnvLocal();
const env = (key) => process.env[key] || envLocal[key] || "";

// ─── Config (all read from env / .env.local, no secrets hardcoded) ────────────
const STORE          = env("SHOPIFY_STORE")         || "us173z-az.myshopify.com";
const CLIENT_ID      = env("SHOPIFY_CLIENT_ID");
const CLIENT_SECRET  = env("SHOPIFY_CLIENT_SECRET");
const VERCEL_TOKEN   = env("VERCEL_TOKEN");          // pass via VERCEL_TOKEN=vcp_xxx
const VERCEL_PROJECT = "prj_kybjI9bieXeRHR6pN4zPq0NFex4R";
const VERCEL_ENV_ID  = "6PoTC2PX0gcK9D5H";          // SHOPIFY_ACCESS_TOKEN env var id
const REDIRECT_URI   = "http://localhost:3333/shopify/callback";
const SCOPES         = "read_products,write_products,read_inventory,write_inventory";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("✗ SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET must be in .env.local");
  process.exit(1);
}
if (!VERCEL_TOKEN) {
  console.error("✗ Run as: VERCEL_TOKEN=vcp_... node scripts/shopify-setup.mjs");
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function shopifyGet(token, p) {
  const r = await fetch(`https://${STORE}/admin/api/2024-01${p}`, {
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Shopify GET ${p} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function shopifyPost(token, p, body) {
  const r = await fetch(`https://${STORE}/admin/api/2024-01${p}`, {
    method: "POST",
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Shopify POST ${p} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function shopifyPut(token, p, body) {
  const r = await fetch(`https://${STORE}/admin/api/2024-01${p}`, {
    method: "PUT",
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Shopify PUT ${p} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function getAllProducts(token) {
  const products = [];
  let page = 1;
  while (true) {
    const data = await shopifyGet(token, `/products.json?limit=250&page=${page}`);
    const batch = data.products ?? [];
    products.push(...batch);
    if (batch.length < 250) break;
    page++;
  }
  return products;
}

async function updateVercelEnv(value) {
  const r = await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT}/env/${VERCEL_ENV_ID}`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ value, type: "encrypted", target: ["production", "preview", "development"] }),
  });
  if (!r.ok) throw new Error(`Vercel PATCH → ${r.status}: ${await r.text()}`);
}

function updateEnvLocal(key, value) {
  const envPath = path.join(ROOT, ".env.local");
  let content = readFileSync(envPath, "utf8");
  const regex = new RegExp(`^${key}=.*$`, "m");
  content = regex.test(content)
    ? content.replace(regex, `${key}=${value}`)
    : content + `\n${key}=${value}`;
  writeFileSync(envPath, content, "utf8");
  console.log(`  ✓ .env.local ${key} updated`);
}

// ─── Step 1: OAuth flow ───────────────────────────────────────────────────────
async function getOAuthToken() {
  return new Promise((resolve, reject) => {
    const state = Math.random().toString(36).slice(2);
    const authUrl =
      `https://${STORE}/admin/oauth/authorize` +
      `?client_id=${CLIENT_ID}` +
      `&scope=${SCOPES}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&state=${state}`;

    console.log("\n╔══════════════════════════════════════════════════════════════╗");
    console.log("║         SHOPIFY AUTHORIZATION REQUIRED                       ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");
    console.log("\n  Open this URL in your browser:\n");
    console.log("  " + authUrl + "\n");
    console.log("  Waiting for OAuth callback on http://localhost:3333 ...\n");

    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, "http://localhost:3333");
      if (url.pathname !== "/shopify/callback") { res.end("Not found"); return; }

      const code     = url.searchParams.get("code");
      const gotState = url.searchParams.get("state");
      const error    = url.searchParams.get("error");

      if (error) {
        res.end(`<h1>Authorization failed: ${error}</h1>`);
        server.close();
        reject(new Error("OAuth error: " + error));
        return;
      }
      if (gotState !== state) {
        res.end("<h1>State mismatch</h1>");
        server.close();
        reject(new Error("State mismatch"));
        return;
      }

      const tokenResp = await fetch(`https://${STORE}/admin/oauth/access_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
      });

      if (!tokenResp.ok) {
        const body = await tokenResp.text();
        res.end(`<h1>Token exchange failed: ${tokenResp.status}</h1><pre>${body}</pre>`);
        server.close();
        reject(new Error(`Token exchange ${tokenResp.status}: ${body}`));
        return;
      }

      const { access_token } = await tokenResp.json();
      res.end("<h1>✓ Done! You can close this tab.</h1>");
      server.close();
      resolve(access_token);
    });

    server.listen(3333);
    server.on("error", (e) => reject(new Error("Server: " + e.message)));
  });
}

// ─── Step 2: All variants → always in stock ───────────────────────────────────
async function updateAllVariants(token) {
  console.log("\n── Setting inventory_policy=continue on all variants ─────────────");
  const products = await getAllProducts(token);
  let ok = 0, fail = 0;
  for (const p of products) {
    for (const v of p.variants ?? []) {
      try {
        await shopifyPut(token, `/variants/${v.id}.json`, {
          variant: { id: v.id, inventory_policy: "continue", inventory_management: null },
        });
        ok++;
        process.stdout.write(".");
      } catch (e) {
        fail++;
        console.error(`\n  ✗ ${p.title}/${v.title}: ${e.message}`);
      }
    }
  }
  console.log(`\n  ✓ ${ok} updated, ${fail} failed`);
}

// ─── Step 3: Sleeve product ───────────────────────────────────────────────────
const EXISTING_SLEEVE_ID = "57447930986827";

async function ensureSleeveProduct(token) {
  console.log("\n── Checking sleeve add-on variant ───────────────────────────────");
  try {
    const d = await shopifyGet(token, `/variants/${EXISTING_SLEEVE_ID}.json`);
    if (d.variant) {
      console.log(`  ✓ Sleeve variant ${EXISTING_SLEEVE_ID} exists — no change needed`);
      return EXISTING_SLEEVE_ID;
    }
  } catch {
    // not found — create
  }

  console.log("  Creating Piedurknes izšuvums / Sleeve Embroidery product...");
  const resp = await shopifyPost(token, "/products.json", {
    product: {
      title: "Piedurknes izšuvums / Sleeve Embroidery",
      body_html: "Add-on: embroidery design on sleeve",
      product_type: "Add-on",
      status: "active",
      published: true,
      variants: [{
        title: "Default Title",
        price: "25.00",
        inventory_management: null,
        inventory_policy: "continue",
        requires_shipping: false,
        taxable: true,
      }],
    },
  });

  const newId = String(resp.product.variants[0].id);
  console.log(`  ✓ Created — new variant ID: ${newId}`);
  return newId;
}

// ─── Step 4: page.tsx ─────────────────────────────────────────────────────────
function updatePageTsx(variantId) {
  if (variantId === EXISTING_SLEEVE_ID) return;
  const pagePath = path.join(ROOT, "app", "page.tsx");
  let content = readFileSync(pagePath, "utf8");
  content = content.replace(
    /const SLEEVE_PHOTO_ADDON_VARIANT_ID = ".*?";/,
    `const SLEEVE_PHOTO_ADDON_VARIANT_ID = "${variantId}";`
  );
  writeFileSync(pagePath, content, "utf8");
  console.log(`  ✓ page.tsx: SLEEVE_PHOTO_ADDON_VARIANT_ID = "${variantId}"`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log("TinyThread Shopify Setup\n");

  const token = await getOAuthToken();
  console.log("  ✓ Got token:", token.substring(0, 10) + "...");

  // Save immediately
  console.log("\n── Saving access token ──────────────────────────────────────────");
  try { await updateVercelEnv(token); console.log("  ✓ Vercel updated"); }
  catch (e) { console.error("  Vercel error:", e.message); }
  updateEnvLocal("SHOPIFY_ACCESS_TOKEN", token);

  await updateAllVariants(token);
  const sleeveId = await ensureSleeveProduct(token);
  updatePageTsx(sleeveId);

  // Commit + push if anything changed
  try {
    execSync("git add app/page.tsx", { cwd: ROOT });
    const diff = execSync("git diff --cached --name-only", { cwd: ROOT }).toString().trim();
    if (diff) {
      execSync(`git commit -m "Update SLEEVE_PHOTO_ADDON_VARIANT_ID to ${sleeveId}"`, { cwd: ROOT, stdio: "inherit" });
      execSync("git push origin main", { cwd: ROOT, stdio: "inherit" });
      console.log("\n  ✓ Committed and pushed");
    } else {
      console.log("\n  (No page.tsx changes to commit)");
    }
  } catch (e) {
    console.error("  git error:", e.message);
  }

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  ✓ ALL DONE                                                  ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
})().catch((e) => {
  console.error("\n✗ Failed:", e.message);
  if (e.message.includes("redirect_uri") || e.message.includes("OAuth")) {
    console.error("\n  → Add this to Shopify app Allowed Redirect URLs:");
    console.error("    http://localhost:3333/shopify/callback\n");
  }
  process.exit(1);
});
