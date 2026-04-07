import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";

// Garment image URLs stored on Vercel Blob
const GARMENT_URLS: Record<string, string> = {
  "hoodie-black-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-black-front-L8JNMTYtT2Xneu4ym3Ax12fau4pIHq.jpg",
  "hoodie-black-back": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-black-back-Lfr4AB79XMlYiUB9Qa9V4CSpdwQJQM.jpg",
  "hoodie-white-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-white-front-k4zZvfmeQ2iVRi7MzQy94KPnW4ebyY.jpg",
  "hoodie-white-back": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-white-back.jpg-X5I6sYplyDPZPlPnUEP1gK81mtIe8Q.jpeg",
  "cap-black-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cap-black-front.jpg-MIVejSe8JWwmgLY47q8dnpjKC393xd.jpeg",
  "cap-white-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cap-white-front-kYisZ76gyCeeLb3IYogIXdTJo7mXkO.jpg",
};

async function generateComposite(
  garmentUrl: string,
  designUrl: string,
  posX: number,
  posY: number,
  designSizePx: number
): Promise<string | null> {
  try {
    const W = 800;
    const H = 1000;
    const designSize = Math.round((designSizePx / 780) * W);
    const left = Math.round(W * posX / 100 - designSize / 2);
    const top = Math.round(H * posY / 100 - designSize / 2);

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
            src={designUrl}
            width={designSize}
            height={designSize}
            style={{ position: "absolute", left: left, top: top, width: designSize, height: designSize }}
          />
        </div>
      ),
      { width: W, height: H }
    );

    const arrayBuffer = await compositeImage.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  } catch (err) {
    console.error("[WEBHOOK] Composite error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[WEBHOOK] Order paid received:", body.id);

    const orderNumber = body.order_number || body.name || "Unknown";
    const customerEmail = body.email || "Unknown";
    const customerName = body.shipping_address?.name || body.billing_address?.name || customerEmail;

    const lineItems = body.line_items || [];

    for (const item of lineItems) {
      const properties = item.properties || [];
      const getProp = (name: string) => properties.find((p: { name: string; value: string }) => p.name === name)?.value || null;

      const style = getProp("Embroidery Style") || "Unknown";
      const size = getProp("Embroidery Size") || "Unknown";
      const placement = getProp("Placement") || "front";
      const designCount = getProp("Design Count") || "1";

      // Front design
      const frontDesignUrl = getProp("_design_image");
      const frontGarmentRef = getProp("_garment");
      const frontGarmentUrl = frontGarmentRef ? GARMENT_URLS[frontGarmentRef] || null : null;

      // Back design
      const backDesignUrl = getProp("_design_image_back");
      const backGarmentRef = getProp("_garment_back");
      const backGarmentUrl = backGarmentRef ? GARMENT_URLS[backGarmentRef] || null : null;

      // Parse positions
      let positionsData: { view: string; x: number; y: number; size: number; rotation?: number }[] = [];
      try {
        positionsData = JSON.parse(getProp("_positions") || "[]");
      } catch {}

      const frontPos = positionsData.find(p => p.view === "front") || { x: 50, y: 40, size: 150 };
      const backPos = positionsData.find(p => p.view === "back") || { x: 50, y: 40, size: 150 };

      console.log("[WEBHOOK] Item:", item.title, "Style:", style, "Placement:", placement);

      // Generate front placement composite
      let frontBase64: string | null = null;
      if (frontGarmentUrl && frontDesignUrl) {
        frontBase64 = await generateComposite(frontGarmentUrl, frontDesignUrl, frontPos.x, frontPos.y, frontPos.size);
        if (frontBase64) console.log("[WEBHOOK] Front composite OK");
      }

      // Generate back placement composite
      let backBase64: string | null = null;
      if (backGarmentUrl && backDesignUrl) {
        backBase64 = await generateComposite(backGarmentUrl, backDesignUrl, backPos.x, backPos.y, backPos.size);
        if (backBase64) console.log("[WEBHOOK] Back composite OK");
      }

      // Position info for email
      const positionInfo = positionsData.map(p =>
        `${p.view}: offset x=${Math.round(p.x)}%, y=${Math.round(p.y)}%, size=${Math.round((p.size / 780) * 700)}mm`
      ).join("<br>");

      // Vectorize URLs for on-demand download
      const frontVectorizeUrl = frontDesignUrl
        ? `https://v0-tiny-thread-app-build.vercel.app/api/vectorize-and-send?image=${encodeURIComponent(frontDesignUrl)}&order=${orderNumber}-front`
        : null;
      const backVectorizeUrl = backDesignUrl
        ? `https://v0-tiny-thread-app-build.vercel.app/api/vectorize-and-send?image=${encodeURIComponent(backDesignUrl)}&order=${orderNumber}-back`
        : null;

      // Build email HTML
      const hasBothSides = frontBase64 && backBase64;

      const emailHtml = `
        <div style="font-family: system-ui, sans-serif; max-width: 600px;">
          <h1 style="color: #f59e0b;">New TinyThread Order</h1>
          <hr style="border: 1px solid #eee;">

          <h2>Order #${orderNumber}</h2>
          <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>

          <h3>Design Specifications:</h3>
          <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Product</td><td style="padding: 8px; border: 1px solid #ddd;">${item.title}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Embroidery Style</td><td style="padding: 8px; border: 1px solid #ddd;">${style}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Embroidery Size</td><td style="padding: 8px; border: 1px solid #ddd;">${size}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Placement</td><td style="padding: 8px; border: 1px solid #ddd;">${placement}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Design Count</td><td style="padding: 8px; border: 1px solid #ddd;">${designCount}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Price</td><td style="padding: 8px; border: 1px solid #ddd;">€${item.price}</td></tr>
          </table>

          <h3>Design Placement:</h3>
          ${frontBase64
            ? `<p style="font-size: 13px; color: #666;"><strong>Front:</strong> See attached <strong>placement-front.png</strong></p>`
            : `<p style="color: #999;">Front placement image not available.</p>`
          }
          ${backBase64
            ? `<p style="font-size: 13px; color: #666;"><strong>Back:</strong> See attached <strong>placement-back.png</strong></p>`
            : hasBothSides ? `<p style="color: #999;">Back placement image not available.</p>` : ""
          }
          ${!frontBase64 && !backBase64
            ? `<p style="color: #999;">No placement images could be generated.</p>`
            : ""
          }

          ${positionInfo ? `
            <p style="margin-top: 8px; font-size: 13px;"><strong>Position details:</strong><br>${positionInfo}</p>
          ` : ""}

          <h3 style="margin-top: 20px;">Vector Files:</h3>
          ${frontVectorizeUrl ? `
            <p>
              <a href="${frontVectorizeUrl}" style="display: inline-block; padding: 10px 20px; background: #f59e0b; color: black; font-weight: bold; border-radius: 8px; text-decoration: none;">
                Download Front Vector (SVG)
              </a>
            </p>
          ` : ""}
          ${backVectorizeUrl ? `
            <p style="margin-top: 8px;">
              <a href="${backVectorizeUrl}" style="display: inline-block; padding: 10px 20px; background: #f59e0b; color: black; font-weight: bold; border-radius: 8px; text-decoration: none;">
                Download Back Vector (SVG)
              </a>
            </p>
          ` : ""}
          ${!frontVectorizeUrl && !backVectorizeUrl ? `<p style="color: #999;">No design images available for vectorization.</p>` : ""}
          <p style="font-size: 12px; color: #666; margin-top: 4px;">Click to generate and download the vectorized file on-demand.</p>

          <hr style="border: 1px solid #eee; margin-top: 24px;">
          <p style="color: #999; font-size: 12px;">This is an automated message from TinyThread Studio.</p>
        </div>
      `;

      // Build attachments
      const attachments: { filename: string; content: string; content_type: string }[] = [];
      if (frontBase64) {
        attachments.push({
          filename: hasBothSides ? "placement-front.png" : "placement.png",
          content: frontBase64,
          content_type: "image/png",
        });
      }
      if (backBase64) {
        attachments.push({
          filename: "placement-back.png",
          content: backBase64,
          content_type: "image/png",
        });
      }

      // Send email
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": "Bearer re_GMuGpfwE_E1cAyaCFg11J354XszsD1DLo",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "TinyThread Orders <onboarding@resend.dev>",
          to: ["karvelsm@gmail.com"],
          subject: `New Order #${orderNumber} — ${item.title}`,
          html: emailHtml,
          attachments,
        })
      });

      const emailResult = await emailResponse.json();
      console.log("[WEBHOOK] Email result:", emailResult);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WEBHOOK] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
