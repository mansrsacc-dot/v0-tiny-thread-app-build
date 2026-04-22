import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";

const GARMENT_URLS: Record<string, string> = {
  "hoodie-black-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-black-front-L8JNMTYtT2Xneu4ym3Ax12fau4pIHq.jpg",
  "hoodie-black-back": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-black-back-Lfr4AB79XMlYiUB9Qa9V4CSpdwQJQM.jpg",
  "hoodie-white-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-white-front-k4zZvfmeQ2iVRi7MzQy94KPnW4ebyY.jpg",
  "hoodie-white-back": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-white-back.jpg-X5I6sYplyDPZPlPnUEP1gK81mtIe8Q.jpeg",
  "cap-black-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cap-black-front.jpg-MIVejSe8JWwmgLY47q8dnpjKC393xd.jpeg",
  "cap-white-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cap-white-front-kYisZ76gyCeeLb3IYogIXdTJo7mXkO.jpg",
};

async function generateComposite(garmentUrl: string, designUrl: string, posX: number, posY: number, designSizePx: number): Promise<string | null> {
  try {
    const W = 800, H = 1000;
    const designSize = Math.round((designSizePx / 780) * W);
    const left = Math.round(W * posX / 100 - designSize / 2);
    const top = Math.round(H * posY / 100 - designSize / 2);

    const img = new ImageResponse(
      (<div style={{ width: W, height: H, position: "relative", display: "flex" }}>
        <img src={garmentUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }} />
        <img src={designUrl} width={designSize} height={designSize} style={{ position: "absolute", left, top, width: designSize, height: designSize }} />
      </div>),
      { width: W, height: H }
    );
    const buf = await img.arrayBuffer();
    return Buffer.from(buf).toString("base64");
  } catch (e) { console.error("[PLACEMENT] Composite error:", e); return null; }
}

async function vectorizeDesign(designUrl: string): Promise<Buffer | null> {
  try {
    const imageRes = await fetch(designUrl);
    const imageBlob = await imageRes.blob();

    const formData = new FormData();
    formData.append("image", imageBlob, "design.png");
    formData.append("processing.max_colors", "16");
    formData.append("output.gap_filler.enabled", "false");

    const vecRes = await fetch("https://vectorizer.ai/api/v1/vectorize", {
      method: "POST",
      headers: { "Authorization": "Basic " + btoa("vkhpaa5kmksrknd:snt3ii13v1s63o4554clpecm68n87t27g580qvfq50qr143dp4h4") },
      body: formData,
    });

    if (!vecRes.ok) return null;
    const buf = await vecRes.arrayBuffer();
    return Buffer.from(buf);
  } catch (e) { console.error("[PLACEMENT] Vectorize error:", e); return null; }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { designs, product, garmentColor, size } = body;
    // designs: [{ view, style, designUrl, garmentRef, originalBase64, position: {x,y}, sizePx }]

    if (!designs || designs.length === 0) {
      return NextResponse.json({ error: "No designs" }, { status: 400 });
    }

    const attachments: { filename: string; content: string; content_type: string }[] = [];
    let designHtml = "";

    for (const d of designs) {
      const garmentUrl = d.garmentRef ? GARMENT_URLS[d.garmentRef] : null;
      const view = d.view || "front";
      const viewLabel = view.charAt(0).toUpperCase() + view.slice(1);

      // 1. Placement composite
      if (garmentUrl && d.designUrl) {
        const composite = await generateComposite(garmentUrl, d.designUrl, d.position?.x || 50, d.position?.y || 40, d.sizePx || 150);
        if (composite) {
          attachments.push({ filename: `placement-${view}.png`, content: composite, content_type: "image/png" });
          designHtml += `<p><strong>${viewLabel}:</strong> See attached placement-${view}.png</p>`;
        }
      }

      // 2. Original photo
      if (d.originalBase64) {
        const originalData = d.originalBase64.includes(",") ? d.originalBase64.split(",")[1] : d.originalBase64;
        attachments.push({ filename: `original-${view}.jpg`, content: originalData, content_type: "image/jpeg" });
        designHtml += `<p>Original photo: original-${view}.jpg</p>`;
      }

      // 3. SVG vector
      if (d.designUrl) {
        const svg = await vectorizeDesign(d.designUrl);
        if (svg) {
          attachments.push({ filename: `vector-${view}.svg`, content: svg.toString("base64"), content_type: "image/svg+xml" });
          designHtml += `<p>Vector file: vector-${view}.svg</p>`;
        }
      }
    }

    const sizeMm = designs[0]?.sizePx ? Math.round((designs[0].sizePx / 780) * 700) : 100;
    const style = designs.map((d: any) => d.style).join(", ");
    const placement = designs.map((d: any) => d.view).join(", ");

    const emailHtml = `
      <div style="font-family: system-ui, sans-serif; max-width: 600px;">
        <h1 style="color: #3e92cc;">TinyThread - New Design</h1>
        <hr style="border: 1px solid #eee;">
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Product</td><td style="padding: 8px; border: 1px solid #ddd;">${product || "Hoodie"} ${garmentColor || "Black"}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Style</td><td style="padding: 8px; border: 1px solid #ddd;">${style}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Size</td><td style="padding: 8px; border: 1px solid #ddd;">${size || "M"} (${sizeMm}mm)</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Placement</td><td style="padding: 8px; border: 1px solid #ddd;">${placement}</td></tr>
        </table>
        <h3>Attachments:</h3>
        ${designHtml || "<p>No attachments generated</p>"}
        <p style="font-size: 12px; color: #666;">Each design includes: placement on garment, original photo, and SVG vector file.</p>
        <hr style="border: 1px solid #eee; margin-top: 24px;">
        <p style="color: #999; font-size: 12px;">TinyThread Studio</p>
      </div>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer re_GMuGpfwE_E1cAyaCFg11J354XszsD1DLo",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TinyThread Orders <onboarding@resend.dev>",
        to: ["karvelsm@gmail.com"],
        subject: `TinyThread Design - ${product} ${garmentColor} - ${style}`,
        html: emailHtml,
        attachments,
      }),
    });

    const emailData = await emailRes.json();
    console.log("[PLACEMENT] Email sent:", emailData);

    return NextResponse.json({ success: true, emailId: emailData.id, attachmentCount: attachments.length });
  } catch (error: any) {
    console.error("[PLACEMENT] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
