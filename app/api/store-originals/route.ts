import { NextRequest, NextResponse } from "next/server";

// Simple in-memory store for original photos between cart and webhook
// In production, use Redis or a database
const store: Record<string, Record<string, string>> = {};

// Clean up entries older than 1 hour
function cleanup() {
  const now = Date.now();
  for (const key in store) {
    const ts = parseInt(key.split("_")[0] || "0");
    if (now - ts > 3600000) delete store[key];
  }
}

// POST - store original photos
export async function POST(req: NextRequest) {
  try {
    cleanup();
    const { orderRef, originals } = await req.json();
    if (!orderRef || !originals) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }
    store[orderRef] = originals;
    console.log("[STORE-ORIGINALS] Saved originals for ref:", orderRef, "keys:", Object.keys(originals));
    return NextResponse.json({ success: true, ref: orderRef });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - retrieve original photos
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Missing ref" }, { status: 400 });
  }
  const data = store[ref];
  if (!data) {
    return NextResponse.json({ error: "Not found or expired" }, { status: 404 });
  }
  return NextResponse.json({ originals: data });
}
