import { NextRequest, NextResponse } from "next/server";
import { getShopifyAdminToken } from "@/lib/shopify-admin";

// One-time (or re-runnable) admin endpoint.
// Sets inventory_policy=continue and inventory_management=null on ALL product variants
// so they can always be purchased regardless of stock level.
// Protected with SORTING_PASSWORD header (same as /sorting page).

const STORE = process.env.SHOPIFY_STORE!;

function verifyAuth(req: NextRequest): boolean {
  const auth = req.headers.get("x-sorting-auth");
  return !!process.env.SORTING_PASSWORD && auth === process.env.SORTING_PASSWORD;
}

async function shopifyGet(path: string) {
  const token = await getShopifyAdminToken();
  const r = await fetch(`https://${STORE}/admin/api/2024-01${path}`, {
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Shopify GET ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function shopifyPut(path: string, body: object) {
  const token = await getShopifyAdminToken();
  const r = await fetch(`https://${STORE}/admin/api/2024-01${path}`, {
    method: "PUT",
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Shopify PUT ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function getAllProducts() {
  const products: any[] = [];
  let url: string | null = `https://${STORE}/admin/api/2024-01/products.json?limit=250`;
  while (url) {
    const token = await getShopifyAdminToken();
    const r: Response = await fetch(url, {
      headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`Shopify GET products → ${r.status}: ${await r.text()}`);
    const data = await r.json();
    products.push(...(data.products ?? []));
    const link: string = r.headers.get("link") || "";
    const next: RegExpMatchArray | null = link.match(/<([^>]+)>;\s*rel="next"/);
    url = next ? next[1] : null;
  }
  return products;
}

// POST: update all variants to inventory_policy=continue, inventory_management=null
export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: {
    productTitle: string;
    variantId: number;
    variantTitle: string;
    updated: boolean;
    error?: string;
  }[] = [];

  try {
    const products = await getAllProducts();

    for (const product of products) {
      for (const variant of product.variants ?? []) {
        try {
          await shopifyPut(`/variants/${variant.id}.json`, {
            variant: {
              id: variant.id,
              inventory_policy: "continue",
              inventory_management: null,
            },
          });
          results.push({ productTitle: product.title, variantId: variant.id, variantTitle: variant.title, updated: true });
        } catch (e: any) {
          results.push({ productTitle: product.title, variantId: variant.id, variantTitle: variant.title, updated: false, error: e.message });
        }
      }
    }

    const updated = results.filter(r => r.updated).length;
    const failed  = results.filter(r => !r.updated).length;
    console.log(`[UPDATE-INVENTORY] Done: ${updated} updated, ${failed} failed`);
    return NextResponse.json({ ok: true, updated, failed, results });
  } catch (e: any) {
    console.error("[UPDATE-INVENTORY] Fatal:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET: read-only check of current inventory_policy for all variants
export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await getAllProducts();
    const variants = products.flatMap(p =>
      (p.variants ?? []).map((v: any) => ({
        productTitle: p.title,
        variantId: v.id,
        variantTitle: v.title,
        inventory_policy: v.inventory_policy,
        inventory_management: v.inventory_management,
      }))
    );
    return NextResponse.json({ total: variants.length, variants });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
