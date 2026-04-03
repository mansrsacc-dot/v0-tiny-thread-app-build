import { NextRequest, NextResponse } from "next/server";

// Garment image URLs from lib/garment-images.ts
const GARMENT_URLS: Record<string, string> = {
  "hoodie-black-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-black-front-L8JNMTYtT2Xneu4ym3Ax12fau4pIHq.jpg",
  "hoodie-black-back": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-black-back-Lfr4AB79XMlYiUB9Qa9V4CSpdwQJQM.jpg",
  "hoodie-white-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-white-front-k4zZvfmeQ2iVRi7MzQy94KPnW4ebyY.jpg",
  "hoodie-white-back": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-white-back.jpg-X5I6sYplyDPZPlPnUEP1gK81mtIe8Q.jpeg",
  "cap-black-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cap-black-front.jpg-MIVejSe8JWwmgLY47q8dnpjKC393xd.jpeg",
  "cap-white-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cap-white-front-kYisZ76gyCeeLb3IYogIXdTJo7mXkO.jpg",
};

export async function POST(req: NextRequest) {
  try {
    // Dynamic import of Jimp v1 to avoid build-time issues
    const { Jimp } = await import("jimp");
    
    const body = await req.json();
    const { garmentRef, designImageUrl, positionX, positionY, designSizePx } = body;

    // Get garment URL from mapping
    const garmentUrl = GARMENT_URLS[garmentRef];
    if (!garmentUrl || !designImageUrl) {
      return NextResponse.json({ error: "Missing garment or design URL" }, { status: 400 });
    }

    console.log("[PLACEMENT] Garment:", garmentRef);
    console.log("[PLACEMENT] Design:", designImageUrl.substring(0, 60));

    // Load garment image
    const garment = await Jimp.read(garmentUrl);
    garment.resize({ w: 800, h: 1000 });

    // Load design image
    const design = await Jimp.read(designImageUrl);

    // Calculate design size on canvas
    const designCanvasSize = Math.round((designSizePx / 780) * 800);
    design.resize({ w: designCanvasSize, h: designCanvasSize });

    // Calculate position
    const centerX = Math.round(800 * (50 + (positionX || 0)) / 100);
    const centerY = Math.round(1000 * (35 + (positionY || 0)) / 100);
    const drawX = Math.max(0, Math.round(centerX - designCanvasSize / 2));
    const drawY = Math.max(0, Math.round(centerY - designCanvasSize / 2));

    // Composite design onto garment
    garment.composite(design, drawX, drawY);

    // Convert to JPEG buffer
    const buffer = await garment.getBuffer("image/jpeg");
    const base64 = Buffer.from(buffer).toString("base64");

    console.log("[PLACEMENT] Success! Buffer size:", buffer.length);

    return NextResponse.json({ base64, success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PLACEMENT] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
