import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const {
      garmentUrl,
      designImageUrl,
      positionX = 0,
      positionY = 0,
      designSizePx = 150,
    } = await req.json();

    if (!garmentUrl || !designImageUrl) {
      return NextResponse.json({ error: "Missing URLs" }, { status: 400 });
    }

    // Canvas dimensions
    const W = 800;
    const H = 1000;

    // Design size on canvas (proportional to the 780px editor width)
    const designSize = Math.round((designSizePx / 780) * W);

    // Position: center of garment chest area, offset by user's drag
    const left = Math.round(W * (50 + positionX) / 100 - designSize / 2);
    const top = Math.round(H * (35 + positionY) / 100 - designSize / 2);

    // Generate the composited image using ImageResponse
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            width: W,
            height: H,
            position: "relative",
            display: "flex",
          }}
        >
          {/* Garment as background */}
          <img
            src={garmentUrl}
            width={W}
            height={H}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: W,
              height: H,
              objectFit: "cover",
            }}
          />
          {/* Design overlaid at exact position */}
          <img
            src={designImageUrl}
            width={designSize}
            height={designSize}
            style={{
              position: "absolute",
              left: left,
              top: top,
              width: designSize,
              height: designSize,
            }}
          />
        </div>
      ),
      {
        width: W,
        height: H,
      }
    );

    // Convert the image response to a buffer, then to base64
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({ base64, success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[COMPOSITE] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
