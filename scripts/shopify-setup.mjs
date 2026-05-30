#!/usr/bin/env node
/**
 * TinyThread Shopify Setup Script (client_credentials flow)
 *
 * Does everything in one run:
 * 1. Gets a fresh Shopify Admin API token via client_credentials (no browser needed)
 * 2. Sets inventory_policy=continue + inventory_management=null on ALL variants
 * 3. Checks/creates the "Piedurknes izšuvums / Sleeve Embroidery" product (€25)
 * 4. Updates SLEEVE_PHOTO_ADDON_VARIANT_ID in app/page.tsx if a new variant was created
 * 5. Adds SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET to Vercel env vars
 *
 * Usage:
 *   VERCEL_TOKEN=vcp_xxx node scripts/shopify-setup.mjs
 *
 * Reads SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, SHOPIFY_STORE from .env.local.
 */

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

// ─── Config ───────────────────────────────────────────────────────────────────
const STORE         = env("SHOPIFY_STORE") || "us173z-az.myshopify.com";
const CLIENT_ID     = env("SHOPIFY_CLIENT_ID");
const CLIENT_SECRET = env("SHOPIFY_CLIENT_SECRET");
const VERCEL_TOKEN  = env("VERCEL_TOKEN");
const VERCEL_PROJECT = "prj_kybjI9bieXeRHR6pN4zPq0NFex4R";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("✗ SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET must be in .env.local");
  process.exit(1);
}
if (!VERCEL_TOKEN) {
  console.error("✗ Run as: VERCEL_TOKEN=vcp_... node scripts/shopify-setup.mjs");
  process.exit(1);
}

// ─── Step 1: Get token via client_credentials ─────────────────────────────────
async function getToken() {
  console.log("\n── Getting Shopify Admin token (client_credentials) ─────────────");
  const res = await fetch(`https://${STORE}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: "client_credentials" }),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  console.log(`  ✓ Token acquired (expires_in: ${data.expires_in ?? "unknown"}s)`);
  return data.access_token;
}

// ─── Shopify API helpers ──────────────────────────────────────────────────────
async function shopifyGet(token, p) {
  const r = await fetch(`https://${STORE}/admin/api/2024-01${p}`, {
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
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
  let url = `https://${STORE}/admin/api/2024-01/products.json?limit=250`;
  while (url) {
    const r = await fetch(url, {
      headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    });
    if (!r.ok) throw new Error(`Shopify GET products → ${r.status}: ${await r.text()}`);
    const data = await r.json();
    products.push(...(data.products ?? []));
    // Extract next page cursor from Link header
    const link = r.headers.get("link") || "";
    const next = link.match(/<([^>]+)>;\s*rel="next"/);
    url = next ? next[1] : null;
  }
  return products;
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

// ─── Step 4: Update page.tsx if variant ID changed ───────────────────────────
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

// ─── Step 5: Vercel env vars ──────────────────────────────────────────────────
async function addVercelEnv(key, value) {
  // List existing env vars to find the ID (needed for PATCH)
  const listRes = await fetch(
    `https://api.vercel.com/v9/projects/${VERCEL_PROJECT}/env?limit=100`,
    { headers: { "Authorization": `Bearer ${VERCEL_TOKEN}` } }
  );
  if (!listRes.ok) throw new Error(`Vercel list envs → ${listRes.status}: ${await listRes.text()}`);
  const listData = await listRes.json();
  const existing = (listData.envs ?? []).find((e) => e.key === key);

  if (existing) {
    const patchRes = await fetch(
      `https://api.vercel.com/v9/projects/${VERCEL_PROJECT}/env/${existing.id}`,
      {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ value, type: "encrypted", target: ["production", "preview", "development"] }),
      }
    );
    if (!patchRes.ok) throw new Error(`Vercel PATCH ${key} → ${patchRes.status}: ${await patchRes.text()}`);
    console.log(`  ✓ Vercel: ${key} updated`);
  } else {
    const createRes = await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT}/env`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ key, value, type: "encrypted", target: ["production", "preview", "development"] }),
    });
    if (!createRes.ok) throw new Error(`Vercel POST ${key} → ${createRes.status}: ${await createRes.text()}`);
    console.log(`  ✓ Vercel: ${key} created`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log("TinyThread Shopify Setup (client_credentials)\n");

  const token = await getToken();

  await updateAllVariants(token);
  const sleeveId = await ensureSleeveProduct(token);
  updatePageTsx(sleeveId);

  console.log("\n── Adding SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET to Vercel ───");
  await addVercelEnv("SHOPIFY_CLIENT_ID", CLIENT_ID);
  await addVercelEnv("SHOPIFY_CLIENT_SECRET", CLIENT_SECRET);

  // Commit + push if page.tsx changed
  try {
    execSync("git -C \"" + ROOT + "\" add app/page.tsx", { stdio: "pipe" });
    const diff = execSync("git -C \"" + ROOT + "\" diff --cached --name-only", { stdio: "pipe" }).toString().trim();
    if (diff) {
      execSync(`git -C "${ROOT}" commit -m "Update SLEEVE_PHOTO_ADDON_VARIANT_ID to ${sleeveId}"`, { stdio: "inherit" });
      execSync(`git -C "${ROOT}" push`, { stdio: "inherit" });
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
  process.exit(1);
});
