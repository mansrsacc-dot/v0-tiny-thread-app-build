import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      placementBase64,
      product = "Hoodie",
      garmentColor = "Black",
      style = "outline",
      size = "M",
      designSizePx = 150,
      placement = "front",
      positionX = 0,
      positionY = 0,
    } = body;

    if (!placementBase64 || placementBase64.length < 1000) {
      return NextResponse.json({ error: "Missing or invalid placementBase64" }, { status: 400 });
    }

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
            content: placementBase64,
            content_type: "image/png",
          },
        ],
      }),
    });

    const emailData = await emailRes.json();
    console.log("[SEND-PLACEMENT] Resend response:", JSON.stringify(emailData));

    return NextResponse.json({ success: true, emailId: emailData.id });
  } catch (error: any) {
    console.error("[SEND-PLACEMENT] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
