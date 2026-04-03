import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image" }, { status: 400 });

    // Convert base64 data URL to buffer
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Upload to Vercel Blob
    const blob = await put(`mockup-${Date.now()}.png`, buffer, {
      access: "public",
      contentType: "image/png",
    });

    return NextResponse.json({ id: blob.url });
  } catch (error) {
    console.error("Store mockup error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
