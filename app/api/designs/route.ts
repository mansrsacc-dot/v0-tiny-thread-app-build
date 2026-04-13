import { NextRequest, NextResponse } from "next/server";

// Shopify Admin API credentials
const SHOPIFY_STORE = "us173z-az.myshopify.com";
const SHOPIFY_TOKEN = "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";
const API_VERSION = "2024-01";

// GraphQL helper
async function shopifyGraphQL(query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  return res.json();
}

// GET /api/designs?customerId=123
// Returns saved designs for a customer
export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "Missing customerId" }, { status: 400 });
  }

  try {
    const gid = `gid://shopify/Customer/${customerId}`;
    const result = await shopifyGraphQL(`
      query getDesigns($id: ID!) {
        customer(id: $id) {
          metafield(namespace: "tinythread", key: "saved_designs") {
            value
          }
        }
      }
    `, { id: gid });

    const metafield = result?.data?.customer?.metafield;
    const designs = metafield ? JSON.parse(metafield.value) : [];

    return NextResponse.json({ designs });
  } catch (error: any) {
    console.error("[DESIGNS] GET error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/designs
// Save a design for a customer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, design } = body;

    if (!customerId || !design) {
      return NextResponse.json({ error: "Missing customerId or design" }, { status: 400 });
    }

    const gid = `gid://shopify/Customer/${customerId}`;

    // First, get existing designs
    const existingResult = await shopifyGraphQL(`
      query getDesigns($id: ID!) {
        customer(id: $id) {
          metafield(namespace: "tinythread", key: "saved_designs") {
            value
          }
        }
      }
    `, { id: gid });

    const metafield = existingResult?.data?.customer?.metafield;
    const existingDesigns = metafield ? JSON.parse(metafield.value) : [];

    // Add the new design with a unique ID and timestamp
    const newDesign = {
      id: `design_${Date.now()}`,
      createdAt: new Date().toISOString(),
      originalImageUrl: design.originalImageUrl || null,
      generatedImageUrl: design.generatedImageUrl || null,
      style: design.style || "outline",
      product: design.product || "hoodie",
      garmentColor: design.garmentColor || "black",
      size: design.size || "M",
      position: design.position || { x: 50, y: 40 },
      sizePx: design.sizePx || 150,
      view: design.view || "front",
    };

    existingDesigns.push(newDesign);

    // Save back to Shopify metafield (max 20 designs to keep under metafield size limit)
    const trimmedDesigns = existingDesigns.slice(-20);

    const saveResult = await shopifyGraphQL(`
      mutation saveDesigns($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      input: {
        id: gid,
        metafields: [{
          namespace: "tinythread",
          key: "saved_designs",
          value: JSON.stringify(trimmedDesigns),
          type: "json",
        }],
      },
    });

    const errors = saveResult?.data?.customerUpdate?.userErrors;
    if (errors && errors.length > 0) {
      console.error("[DESIGNS] Save errors:", errors);
      return NextResponse.json({ error: errors[0].message }, { status: 500 });
    }

    return NextResponse.json({ success: true, design: newDesign, total: trimmedDesigns.length });
  } catch (error: any) {
    console.error("[DESIGNS] POST error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/designs
// Delete a specific design
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, designId } = body;

    if (!customerId || !designId) {
      return NextResponse.json({ error: "Missing customerId or designId" }, { status: 400 });
    }

    const gid = `gid://shopify/Customer/${customerId}`;

    // Get existing designs
    const existingResult = await shopifyGraphQL(`
      query getDesigns($id: ID!) {
        customer(id: $id) {
          metafield(namespace: "tinythread", key: "saved_designs") {
            value
          }
        }
      }
    `, { id: gid });

    const metafield = existingResult?.data?.customer?.metafield;
    const existingDesigns = metafield ? JSON.parse(metafield.value) : [];

    // Remove the design
    const filtered = existingDesigns.filter((d: { id: string }) => d.id !== designId);

    // Save back
    await shopifyGraphQL(`
      mutation saveDesigns($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer { id }
          userErrors { field message }
        }
      }
    `, {
      input: {
        id: gid,
        metafields: [{
          namespace: "tinythread",
          key: "saved_designs",
          value: JSON.stringify(filtered),
          type: "json",
        }],
      },
    });

    return NextResponse.json({ success: true, remaining: filtered.length });
  } catch (error: any) {
    console.error("[DESIGNS] DELETE error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
