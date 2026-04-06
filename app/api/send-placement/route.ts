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

    // STEP 1: Call /api/composite-image to merge design onto garment
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const compositeRes = await fetch(`${baseUrl}/api/composite-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        garmentUrl,
        designImageUrl,
        positionX,
        positionY,
        designSizePx,
      }),
    });

    if (!compositeRes.ok) {
      const errText = await compositeRes.text();
      console.error("[SEND-PLACEMENT] Composite route failed:", compositeRes.status, errText);
      return NextResponse.json({ error: "Composite failed: " + errText }, { status: 500 });
    }

    const compositeData = await compositeRes.json();

    if (!compositeData.base64) {
      console.error("[SEND-PLACEMENT] No base64 returned from composite route");
      return NextResponse.json({ error: "No composite image returned" }, { status: 500 });
    }

    console.log("[SEND-PLACEMENT] Got composited image, base64 length:", compositeData.base64.length);

    // STEP 2: Calculate embroidery size in mm
    const sizeMm = Math.round((designSizePx / 780) * 700);

    // STEP 3: Send ONE email with ONE composited image attachment
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
            content: compositeData.base64,
            content_type: "image/png",
          },
        ],
      }),
    });

    const emailData = await emailRes.json();
    console.log("[SEND-PLACEMENT] Resend response:", JSON.stringify(emailData));

    if (!emailRes.ok) {
      return NextResponse.json({ error: "Email failed", details: emailData }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId: emailData.id });
  } catch (error: any) {
    console.error("[SEND-PLACEMENT] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
