import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

// POST /api/store-image
// Takes an image URL (e.g. Replicate) or base64, uploads to Vercel Blob, returns permanent URL
export async function POST(req: NextRequest) {
  try {
    const { imageUrl, base64Data, filename } = await req.json();

    let buffer: Buffer;
    let contentType = "image/png";
    const name = filename || `design_${Date.now()}.png`;

    if (base64Data) {
      // Handle base64 data URL or raw base64
      const raw = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
      buffer = Buffer.from(raw, "base64");
      if (base64Data.includes("image/jpeg")) contentType = "image/jpeg";
    } else if (imageUrl) {
      if (imageUrl.startsWith("data:")) {
        const raw = imageUrl.split(",")[1] || "";
        buffer = Buffer.from(raw, "base64");
        if (imageUrl.includes("image/jpeg")) contentType = "image/jpeg";
      } else {
        // Fetch from URL
        const res = await fetch(imageUrl);
        if (!res.ok) {
          return NextResponse.json({ error: `Failed to fetch: ${res.status}` }, { status: 502 });
        }
        const arrayBuf = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
        contentType = res.headers.get("content-type") || "image/png";
      }
    } else {
      return NextResponse.json({ error: "Missing imageUrl or base64Data" }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(name, buffer, {
      access: "public",
      contentType,
    });

    console.log(`[STORE-IMAGE] Uploaded to Blob: ${blob.url} (${buffer.length} bytes)`);

    return NextResponse.json({ url: blob.url, size: buffer.length });
  } catch (error: any) {
    console.error("[STORE-IMAGE] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
