import { NextRequest, NextResponse } from "next/server";

// Creates a Shopify cart via Storefront API and returns a checkoutUrl.
// Server-side only — no CORS, no browser session cookies needed.
// The returned checkoutUrl is a unique Shopify checkout link containing all items.

const STORE = process.env.SHOPIFY_STORE!; // us173z-az.myshopify.com
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN!;

type CartItem = {
  id: string;        // numeric Shopify variant ID (e.g. "56937201041739")
  quantity: number;
  properties?: Record<string, string>;
};

export async function POST(request: NextRequest) {
  try {
    const { items }: { items: CartItem[] } = await request.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array required" }, { status: 400 });
    }

    const lines = items.map(item => ({
      merchandiseId: `gid://shopify/ProductVariant/${item.id}`,
      quantity: item.quantity,
      attributes: Object.entries(item.properties ?? {}).map(([key, value]) => ({ key, value })),
    }));

    const mutation = `
      mutation cartCreate($lines: [CartLineInput!]!) {
        cartCreate(input: { lines: $lines }) {
          cart {
            id
            checkoutUrl
            lines(first: 20) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant { id title }
                  }
                }
              }
            }
          }
          userErrors { field message }
        }
      }
    `;

    const resp = await fetch(`https://${STORE}/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: mutation, variables: { lines } }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("[CART-ADD] Shopify API HTTP error:", resp.status, text);
      return NextResponse.json({ error: "Shopify API error" }, { status: resp.status });
    }

    const data = await resp.json();
    const userErrors = data.data?.cartCreate?.userErrors ?? [];
    if (userErrors.length > 0) {
      console.error("[CART-ADD] userErrors:", userErrors);
      return NextResponse.json({ error: userErrors[0].message }, { status: 400 });
    }

    const cart = data.data?.cartCreate?.cart;
    if (!cart?.checkoutUrl) {
      console.error("[CART-ADD] No checkoutUrl in response:", JSON.stringify(data));
      return NextResponse.json({ error: "No checkout URL returned" }, { status: 500 });
    }

    console.log("[CART-ADD] Cart created:", cart.id, "lines:", cart.lines?.edges?.length, "checkoutUrl:", cart.checkoutUrl);
    return NextResponse.json({ checkoutUrl: cart.checkoutUrl });
  } catch (err) {
    console.error("[CART-ADD PROXY] Unexpected error:", err);
    return NextResponse.json({ error: "Cart add failed" }, { status: 500 });
  }
}
