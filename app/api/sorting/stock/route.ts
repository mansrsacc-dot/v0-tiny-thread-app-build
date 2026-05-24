import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

const STOCK_PATH = "sorting/stock.json";

const DEFAULT_STOCK = {
  hoodie: {
    black:  { S: 0, M: 0, L: 0, XL: 0 },
    cream:  { S: 0, M: 0, L: 0, XL: 0 },
    white:  { S: 0, M: 0, L: 0, XL: 0 },
  },
  cap: {
    black: 0,
    cream: 0,
  },
};

function verifyAuth(req: NextRequest): boolean {
  const auth = req.headers.get("x-sorting-auth");
  return !!process.env.SORTING_PASSWORD && auth === process.env.SORTING_PASSWORD;
}

async function getStock(): Promise<typeof DEFAULT_STOCK> {
  try {
    const { blobs } = await list({ prefix: "sorting/stock" });
    if (blobs.length === 0) return DEFAULT_STOCK;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    return await res.json();
  } catch {
    return DEFAULT_STOCK;
  }
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stock = await getStock();
  return NextResponse.json({ stock });
}

export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { stock } = await req.json();
    if (!stock) {
      return NextResponse.json({ error: "Trūkst datu" }, { status: 400 });
    }

    await put(STOCK_PATH, JSON.stringify(stock), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[SORTING] Stock update error:", e);
    return NextResponse.json({ error: "Kļūda saglabājot krājumus" }, { status: 500 });
  }
}
