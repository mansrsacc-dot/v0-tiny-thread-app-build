import { NextRequest, NextResponse } from "next/server";

// Server-side proxy for Shopify cart/add.js.
// NOTE: This makes a sessionless server-side request — Shopify creates an isolated cart
// with no cookie linkage to the user's browser. Use this for server-side cart operations
// only. For browser-based cart adds, use the submitCartForm helper in page.tsx which
// does a form POST directly to tinythread.shop/cart/add — that preserves the session cookie.
export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array required" }, { status: 400 });
    }

    const resp = await fetch("https://tinythread.shop/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ items }),
    });

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (err) {
    console.error("[CART-ADD PROXY] Error:", err);
    return NextResponse.json({ error: "Cart add failed" }, { status: 500 });
  }
}
