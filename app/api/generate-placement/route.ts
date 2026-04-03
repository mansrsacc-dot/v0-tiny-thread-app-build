import { NextRequest, NextResponse } from "next/server";
import { createCanvas, loadImage } from "@napi-rs/canvas";

export async function POST(req: NextRequest) {
  try {
    const { garmentImageUrl, designImageUrl, position, designSize, placement, style, size, product, garmentColor } = await req.json();

    if (!garmentImageUrl || !designImageUrl) {
      return NextResponse.json({ error: "Missing images" }, { status: 400 });
    }

    // Create canvas
    const canvas = createCanvas(800, 1000);
    const ctx = canvas.getContext("2d");

    // Load and draw garment image
    const garmentResponse = await fetch(garmentImageUrl);
    const garmentBuffer = Buffer.from(await garmentResponse.arrayBuffer());
    const garmentImg = await loadImage(garmentBuffer);
    ctx.drawImage(garmentImg, 0, 0, 800, 1000);

    // Load and draw design image
    const designResponse = await fetch(designImageUrl);
    const designBuffer = Buffer.from(await designResponse.arrayBuffer());
    const designImg = await loadImage(designBuffer);

    // Calculate design position on the 800x1000 canvas
    // Default position is center chest: x=50%, y=35%
    const xPercent = 50 + (position?.x || 0);
    const yPercent = 35 + (position?.y || 0);
    const drawSize = (designSize / 780) * 800; // scale to canvas
    const drawX = (xPercent / 100) * 800 - drawSize / 2;
    const drawY = (yPercent / 100) * 1000 - drawSize / 2;

    ctx.drawImage(designImg, drawX, drawY, drawSize, drawSize);

    // Draw a subtle border around the design area to highlight placement
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(drawX - 2, drawY - 2, drawSize + 4, drawSize + 4);

    // Draw specs bar at bottom
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 940, 800, 60);
    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 18px sans-serif";
    const sizeMm = Math.round((designSize / 780) * 700);
    ctx.fillText(`${product?.toUpperCase()} | ${garmentColor?.toUpperCase()} | ${placement?.toUpperCase()} | ${style} | ${size} (${sizeMm}mm)`, 16, 975);

    // Convert to JPEG buffer
    const jpegBuffer = canvas.toBuffer("image/jpeg");
    const base64 = jpegBuffer.toString("base64");

    return NextResponse.json({ 
      image: "data:image/jpeg;base64," + base64,
      base64: base64 
    });
  } catch (error) {
    console.error("[PLACEMENT] Error:", error);
    return NextResponse.json({ error: "Failed to generate placement image" }, { status: 500 });
  }
}
