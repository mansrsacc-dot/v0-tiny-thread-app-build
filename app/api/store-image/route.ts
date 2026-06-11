import { NextRequest, NextResponse } from "next/server";

let putFn: any = null;
async function getBlobPut() {
  if (putFn) return putFn;
  try {
    const blob = await import("@vercel/blob");
    putFn = blob.put;
    return putFn;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, base64Data, filename } = await req.json();

    let buffer: Buffer;
    let contentType = "image/png";
    const name = filename || `design_${Date.now()}.png`;

    if (base64Data) {
      const raw = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
      buffer = Buffer.from(raw, "base64");
      if (base64Data.includes("image/jpeg")) contentType = "image/jpeg";
    } else if (imageUrl) {
      if (imageUrl.startsWith("data:")) {
        const raw = imageUrl.split(",")[1] || "";
        buffer = Buffer.from(raw, "base64");
        if (imageUrl.includes("image/jpeg")) contentType = "image/jpeg";
      } else {
        const res = await fetch(imageUrl);
        if (!res.ok) return NextResponse.json({ error: `Fetch failed: ${res.status}` }, { status: 502 });
        const arrayBuf = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
        contentType = res.headers.get("content-type") || "image/png";
      }
    } else {
      return NextResponse.json({ error: "Missing imageUrl or base64Data" }, { status: 400 });
    }

    // Upload to Vercel Blob (permanent URL). FAIL SAFE: if Blob is unavailable we return an
    // error — we must NEVER inline base64, which would bloat cart line-item properties past
    // Shopify's limit and break checkout. Callers handle the failure (abort add-to-cart for
    // the critical design image; omit/skip for previews and gallery saves).
    const put = await getBlobPut();
    if (!put) {
      console.error("[STORE-IMAGE] @vercel/blob unavailable (no put) — failing safe, no base64");
      return NextResponse.json({ error: "blob_upload_failed" }, { status: 502 });
    }
    try {
      const blob = await put(name, buffer, { access: "public", contentType });
      console.log(`[STORE-IMAGE] Blob upload OK: ${blob.url}`);
      return NextResponse.json({ url: blob.url, size: buffer.length });
    } catch (blobErr: any) {
      console.error(`[STORE-IMAGE] Blob failed (${blobErr.message}) — failing safe, no base64`);
      return NextResponse.json({ error: "blob_upload_failed" }, { status: 502 });
    }
  } catch (error: any) {
    console.error("[STORE-IMAGE] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
