import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      garmentUrl,
      designImageUrl,
      positionX = 0,
      positionY = 0,
      designSizePx = 150,
      product = "Hoodie",
      garmentColor = "Black",
      style = "outline",
      size = "M",
      placement = "front",
    } = body;

    if (!garmentUrl || !designImageUrl) {
      return NextResponse.json({ error: "Missing image URLs" }, { status: 400 });
    }

    // --- COMPOSITING: Use ImageResponse (built into Next.js) to overlay design on garment ---
    const W = 800;
    const H = 1000;
    const designSize = Math.round((designSizePx / 780) * W);
    const left = Math.round(W * (50 + positionX) / 100 - designSize / 2);
    const top = Math.round(H * (35 + positionY) / 100 - designSize / 2);

    const compositeImage = new ImageResponse(
      (
        <div style={{ width: W, height: H, position: "relative", display: "flex" }}>
          <img
            src={garmentUrl}
            width={W}
            height={H}
            style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }}
          />
          <img
            src={designImageUrl}
            width={designSize}
            height={designSize}
            style={{ position: "absolute", left: left, top: top, width: designSize, height: designSize }}
          />
        </div>
      ),
      { width: W, height: H }
    );

    const arrayBuffer = await compositeImage.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    // --- END COMPOSITING ---

    // --- EMAIL: Send ONE image to designer ---
    const sizeMm = Math.round((designSizePx / 780) * 700);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">
          TinyThread — New Design Order
        </h2>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9; width: 140px;">Product</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${product}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">Color</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${garmentColor}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">Style</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${style}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">Embroidery Size</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${size} (${sizeMm}mm)</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">Placement</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${placement}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">Position Offset</td>
            <td style="padding: 10px; border: 1px solid #ddd;">x=${positionX}%, y=${positionY}%</td>
          </tr>
        </table>
        <p style="font-weight: bold; margin-top: 20px;">Design placement on garment (exact position):</p>
        <p style="color: #666; font-size: 13px;">See attached: placement.png</p>
      </div>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "TinyThread <onboarding@resend.dev>",
        to: ["karvelsm@gmail.com"],
        subject: "TinyThread — " + product + " " + garmentColor + " — " + style + " " + size,
        html: emailHtml,
        attachments: [
          {
            filename: "placement.png",
            content: base64,
            content_type: "image/png",
          },
        ],
      }),
    });

    const emailData = await emailRes.json();
    return NextResponse.json({ success: true, emailId: emailData.id });
  } catch (error: any) {
    console.error("[SEND-PLACEMENT] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
