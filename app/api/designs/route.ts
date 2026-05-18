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

function metaKey(customerId: string) {
  return `user_${customerId.replace(/[^a-zA-Z0-9]/g, "_")}`;
}

async function getDesigns(customerId: string): Promise<any[]> {
  const key = metaKey(customerId);
  console.log(`[DESIGNS] getDesigns customerId=${customerId} key=${key}`);
  const result = await shopifyGQL(
    `{ shop { metafield(namespace: "tinythread_designs", key: "${key}") { value } } }`
  );
  console.log(`[DESIGNS] getDesigns GQL result:`, JSON.stringify(result?.data ?? result?.errors ?? result).slice(0, 300));
  const val = result?.data?.shop?.metafield?.value;
  const parsed = val ? JSON.parse(val) : [];
  console.log(`[DESIGNS] getDesigns found ${parsed.length} designs`);
  return parsed;
}

async function saveDesigns(customerId: string, designs: any[]) {
  const key = metaKey(customerId);
  const valueJson = JSON.stringify(designs);
  console.log(`[DESIGNS] saveDesigns customerId=${customerId} key=${key} count=${designs.length} valueLen=${valueJson.length}`);
  const result = await shopifyGQL(
    `mutation ($input: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $input) { metafields { key } userErrors { message field } } }`,
    { input: [{ ownerId: SHOP_GID, namespace: "tinythread_designs", key, value: valueJson, type: "json" }] }
  );
  const userErrors = result?.data?.metafieldsSet?.userErrors;
  if (userErrors?.length) {
    console.error(`[DESIGNS] saveDesigns userErrors:`, JSON.stringify(userErrors));
    throw new Error(`Shopify metafield error: ${userErrors.map((e: any) => e.message).join(", ")}`);
  }
  console.log(`[DESIGNS] saveDesigns OK, stored key=${key}`);
}

// GET /api/designs?customerId=xxx
export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customerId");
  if (!customerId) return NextResponse.json({ error: "Missing customerId" }, { status: 400 });
  try {
    const designs = await getDesigns(customerId);
    return NextResponse.json({ designs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/designs - save a design
export async function POST(req: NextRequest) {
  try {
    const { customerId, design } = await req.json();
    if (!customerId || !design) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const designs = await getDesigns(customerId);
    const newDesign = {
      id: `design_${Date.now()}`,
      createdAt: new Date().toISOString(),
      originalImageUrl: design.originalImageUrl || null,
      generatedImageUrl: design.generatedImageUrl || null,
      thumbnailUrl: design.thumbnailUrl || null,
      style: design.style || "outline",
      product: design.product || "hoodie",
      garmentColor: design.garmentColor || "black",
      size: design.size || "M",
      position: design.position || { x: 50, y: 40 },
      sizePx: design.sizePx || 150,
      view: design.view || "front",
    };
    designs.push(newDesign);
    const trimmed = designs.slice(-20);
    await saveDesigns(customerId, trimmed);
    return NextResponse.json({ success: true, design: newDesign, total: trimmed.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/designs
export async function DELETE(req: NextRequest) {
  try {
    const { customerId, designId } = await req.json();
    if (!customerId || !designId) return NextResponse.json({ error: "Missing data" }, { status: 400 });
    const designs = await getDesigns(customerId);
    const filtered = designs.filter((d: any) => d.id !== designId);
    await saveDesigns(customerId, filtered);
    return NextResponse.json({ success: true, remaining: filtered.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
