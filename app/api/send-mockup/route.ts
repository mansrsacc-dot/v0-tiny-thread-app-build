import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { mockupImage, product, garmentColor, view, designs } = await req.json();
    
    if (!mockupImage) {
      return NextResponse.json({ error: "No mockup" }, { status: 400 });
    }

    // Convert base64 to buffer for email attachment
    const base64Data = mockupImage.replace(/^data:image\/\w+;base64,/, "");

    const specs = designs.map((d: { view: string; style: string; size: string; sizeMm: number }) => 
      `${d.view.toUpperCase()} | ${d.style} | ${d.size} | ~${d.sizeMm}mm`
    ).join(" • ");

    // Send placement preview email to designer
    const emailBody = {
      from: "TinyThread <onboarding@resend.dev>",
      to: ["karvelsm@gmail.com"],
      subject: `Placement Preview — ${product} ${garmentColor} ${view}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px;">
          <h2 style="color: #f59e0b;">Design Placement Preview</h2>
          <p>This shows where the customer placed their design on the garment.</p>
          <p><strong>${product.toUpperCase()} | ${garmentColor.toUpperCase()} | ${view.toUpperCase()}</strong></p>
          <p>${specs}</p>
          <p><em>The full order details with EPS file will follow in a separate email when payment is confirmed.</em></p>
        </div>
      `,
      attachments: [
        {
          filename: "placement-preview.png",
          content: base64Data,
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
    console.error("[SEND-MOCKUP] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
