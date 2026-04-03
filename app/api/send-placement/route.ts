import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { placementBase64, product, garmentColor, designs } = await req.json();
    
    if (!placementBase64) {
      return NextResponse.json({ error: "No image" }, { status: 400 });
    }

    const specs = designs.map((d: { view: string; style: string; size: string; sizeMm: number }) => 
      `${d.view.toUpperCase()} | ${d.style} | ${d.size} (${d.sizeMm}mm)`
    ).join(" • ");

    const emailBody = {
      from: "TinyThread <onboarding@resend.dev>",
      to: ["karvelsm@gmail.com"],
      subject: `Design Placement — ${product} ${garmentColor}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px;">
          <h2 style="color: #f59e0b;">Design Placement Preview</h2>
          <p>This shows the exact position and size of the embroidery on the garment.</p>
          <p><strong>${specs}</strong></p>
          <p style="color: #999; font-size: 12px;">The dashed amber border shows the exact embroidery area.</p>
          <p><em>Full order details with EPS file will arrive in a separate email after payment.</em></p>
        </div>
      `,
      attachments: [
        {
          filename: `placement-${product}-${garmentColor}.jpg`,
          content: placementBase64,
        }
      ]
    };

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(emailBody)
    });

    const result = await emailRes.json();
    return NextResponse.json({ success: true, emailId: result.id });
  } catch (error) {
    console.error("[SEND-PLACEMENT] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
