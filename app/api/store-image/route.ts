import { NextRequest, NextResponse } from "next/server";

// Store images as base64 data URLs in the design metadata
// For a production system, use Vercel Blob or S3
// For now, we proxy through this route to fetch and return permanent URLs

// This route fetches an image from a URL (e.g. Replicate) and returns it as base64
// The base64 can then be stored in the design metadata
export async function POST(req: NextRequest) {
  try {
    const { imageUrl, maxWidth = 800 } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    // If it's already a base64 data URL, just return it (truncated if needed)
    if (imageUrl.startsWith("data:")) {
      return NextResponse.json({ base64: imageUrl });
    }

    // Fetch the image
    const res = await fetch(imageUrl);
    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch: ${res.status}` }, { status: 502 });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";
    const base64 = `data:${contentType};base64,${Buffer.from(buffer).toString("base64")}`;

    console.log(`[STORE-IMAGE] Stored image: ${buffer.byteLength} bytes`);

    return NextResponse.json({ base64 });
  } catch (error: any) {
    console.error("[STORE-IMAGE] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
