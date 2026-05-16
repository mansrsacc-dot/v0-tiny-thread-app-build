import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_STORE = process.env.SHOPIFY_STORE!;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const SHOP_GID = process.env.SHOPIFY_SHOP_GID!;

async function shopifyGQL(query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/graphql.json`, {
    method: "POST",
    headers: { "X-Shopify-Access-Token": SHOPIFY_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

// POST - store original photos in shop metafield
export async function POST(req: NextRequest) {
  try {
    const { orderRef, originals } = await req.json();
    if (!orderRef || !originals) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Store as shop metafield with the order ref as key
    const key = orderRef.replace(/[^a-zA-Z0-9_]/g, "_");
    await shopifyGQL(
      `mutation ($input: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $input) { metafields { key } userErrors { message } } }`,
      {
        input: [{
          ownerId: SHOP_GID,
          namespace: "tinythread_originals",
          key,
          value: JSON.stringify(originals),
          type: "json",
        }],
      }
    );

    console.log("[STORE-ORIGINALS] Saved for ref:", orderRef);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - retrieve original photos by order ref
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "Missing ref" }, { status: 400 });

  const key = ref.replace(/[^a-zA-Z0-9_]/g, "_");
  const result = await shopifyGQL(
    `{ shop { metafield(namespace: "tinythread_originals", key: "${key}") { value } } }`
  );
  const val = result?.data?.shop?.metafield?.value;
  if (!val) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ originals: JSON.parse(val) });
}
