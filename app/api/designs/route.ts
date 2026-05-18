import { NextRequest, NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";

// GET /api/designs?customerId=xxx
// Lists all blobs under designs/{customerId}/ and returns their JSON content.
export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customerId");
  if (!customerId) return NextResponse.json({ error: "Missing customerId" }, { status: 400 });

  try {
    const prefix = `designs/${customerId}/`;
    console.log(`[DESIGNS] GET listing blobs with prefix=${prefix}`);
    const { blobs } = await list({ prefix });
    console.log(`[DESIGNS] GET found ${blobs.length} blobs`);

    const designs = (
      await Promise.all(
        blobs.map(async (blob) => {
          try {
            const res = await fetch(blob.url);
            if (!res.ok) return null;
            return await res.json();
          } catch {
            return null;
          }
        })
      )
    )
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ designs });
  } catch (error: any) {
    console.error("[DESIGNS] GET error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/designs — save a design as a JSON blob
export async function POST(req: NextRequest) {
  try {
    const { customerId, design } = await req.json();
    if (!customerId || !design) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const designId = `design_${Date.now()}`;
    const newDesign = {
      id: designId,
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

    const pathname = `designs/${customerId}/${designId}.json`;
    console.log(`[DESIGNS] POST saving to Blob path=${pathname}`);
    const blob = await put(pathname, JSON.stringify(newDesign), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });
    console.log(`[DESIGNS] POST saved OK url=${blob.url}`);

    return NextResponse.json({ success: true, design: newDesign });
  } catch (error: any) {
    console.error("[DESIGNS] POST error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/designs — remove a single design blob
export async function DELETE(req: NextRequest) {
  try {
    const { customerId, designId } = await req.json();
    if (!customerId || !designId) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const prefix = `designs/${customerId}/${designId}`;
    const { blobs } = await list({ prefix });
    if (blobs.length > 0) {
      await Promise.all(blobs.map((b) => del(b.url)));
      console.log(`[DESIGNS] DELETE removed ${blobs.length} blob(s) for designId=${designId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DESIGNS] DELETE error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
