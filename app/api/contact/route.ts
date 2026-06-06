import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TinyThread Orders <orders@tinythread.shop>",
        to: ["karvelsm@gmail.com"],
        reply_to: email,
        subject: `Kontaktu forma: ${subject}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px">
            <h2>Jauns ziņojums no kontaktu formas</h2>
            <p><strong>Vārds:</strong> ${name}</p>
            <p><strong>E-pasts:</strong> ${email}</p>
            <p><strong>Temats:</strong> ${subject}</p>
            <p><strong>Ziņojums:</strong></p>
            <p style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:4px">${message}</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[CONTACT] Resend error:", err);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[CONTACT] Error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
