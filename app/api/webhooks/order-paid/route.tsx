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

const SHOPIFY_STORE = "us173z-az.myshopify.com";
const SHOPIFY_TOKEN = "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";

async function shopifyGQL(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/graphql.json`, {
    method: "POST",
    headers: { "X-Shopify-Access-Token": SHOPIFY_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

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
  } catch (e) { console.error("[WEBHOOK] Composite error:", e); return null; }
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return Buffer.from(buf).toString("base64");
  } catch { return null; }
}

async function vectorizeDesign(designUrl: string): Promise<string | null> {
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
    return Buffer.from(buf).toString("base64");
  } catch (e) { console.error("[WEBHOOK] Vectorize error:", e); return null; }
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = String(body.id || "");
  console.log("[WEBHOOK] Order paid:", orderId);

  // Deduplication: check if we already processed this order
  if (orderId) {
    try {
      const key = `order_${orderId}`;
      const checkResult = await shopifyGQL(`{ shop { metafield(namespace: "tinythread_processed", key: "${key}") { value } } }`);
      if (checkResult?.data?.shop?.metafield?.value) {
        console.log("[WEBHOOK] Already processed order", orderId, "- skipping");
        return NextResponse.json({ success: true, skipped: true });
      }
      // Mark as processing immediately
      await shopifyGQL(
        `mutation ($input: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $input) { metafields { key } userErrors { message } } }`,
        { input: [{ ownerId: "gid://shopify/Shop/103759446347", namespace: "tinythread_processed", key, value: new Date().toISOString(), type: "single_line_text_field" }] }
      );
    } catch (e) {
      console.error("[WEBHOOK] Dedup check error:", e);
    }
  }

  try {

    const orderNumber = body.order_number || body.name || "Unknown";
    const customerEmail = body.email || "Unknown";
    const customerName = body.shipping_address?.name || body.billing_address?.name || customerEmail;

    for (const item of (body.line_items || [])) {
      const properties = item.properties || [];
      const getProp = (name: string) => properties.find((p: { name: string; value: string }) => p.name === name)?.value || null;

      const style = getProp("Embroidery Style") || "Unknown";
      const size = getProp("Embroidery Size") || "Unknown";
      const placement = getProp("Placement") || "front";
      const designCount = getProp("Design Count") || "1";
      const orderRef = getProp("_order_ref");

      const frontDesignUrl = getProp("_design_image");
      const frontGarmentRef = getProp("_garment");
      const frontGarmentUrl = frontGarmentRef ? GARMENT_URLS[frontGarmentRef] : null;

      const backDesignUrl = getProp("_design_image_back");
      const backGarmentRef = getProp("_garment_back");
      const backGarmentUrl = backGarmentRef ? GARMENT_URLS[backGarmentRef] : null;

      let positionsData: { view: string; x: number; y: number; size: number }[] = [];
      try { positionsData = JSON.parse(getProp("_positions") || "[]"); } catch {}
      const frontPos = positionsData.find(p => p.view === "front") || { x: 50, y: 40, size: 150 };
      const backPos = positionsData.find(p => p.view === "back") || { x: 50, y: 40, size: 150 };

      // Retrieve original photos from shop metafield
      let frontOriginalBase64: string | null = null;
      let backOriginalBase64: string | null = null;
      if (orderRef) {
        try {
          const key = orderRef.replace(/[^a-zA-Z0-9_]/g, "_");
          const result = await shopifyGQL(`{ shop { metafield(namespace: "tinythread_originals", key: "${key}") { value } } }`);
          const val = result?.data?.shop?.metafield?.value;
          if (val) {
            const originals = JSON.parse(val);
            if (originals.front) {
              const data = originals.front.includes(",") ? originals.front.split(",")[1] : originals.front;
              frontOriginalBase64 = data;
            }
            if (originals.back) {
              const data = originals.back.includes(",") ? originals.back.split(",")[1] : originals.back;
              backOriginalBase64 = data;
            }
          }
        } catch (e) { console.error("[WEBHOOK] Failed to load originals:", e); }
      }

      console.log("[WEBHOOK] Processing:", item.title, "| Style:", style, "| Placement:", placement);

      const attachments: { filename: string; content: string; content_type: string }[] = [];
      let attachmentHtml = "";

      // Process each side
      for (const side of ["front", "back"] as const) {
        const designUrl = side === "front" ? frontDesignUrl : backDesignUrl;
        const garmentUrl = side === "front" ? frontGarmentUrl : backGarmentUrl;
        const pos = side === "front" ? frontPos : backPos;
        const originalBase64 = side === "front" ? frontOriginalBase64 : backOriginalBase64;
        const label = side.charAt(0).toUpperCase() + side.slice(1);

        if (!designUrl) continue;

        attachmentHtml += `<h4 style="margin-top: 16px; color: #f59e0b;">${label} Design:</h4><ul style="font-size: 13px; color: #666;">`;

        // 1. Original photo
        if (originalBase64) {
          attachments.push({ filename: `original-${side}.jpg`, content: originalBase64, content_type: "image/jpeg" });
          attachmentHtml += `<li>original-${side}.jpg - Customer's uploaded photo</li>`;
        }

        // 2. Generated design
        const generatedBase64 = await fetchImageAsBase64(designUrl);
        if (generatedBase64) {
          attachments.push({ filename: `generated-${side}.png`, content: generatedBase64, content_type: "image/png" });
          attachmentHtml += `<li>generated-${side}.png - Generated embroidery design</li>`;
        }

        // 3. Placement on garment
        if (garmentUrl) {
          const placementBase64 = await generateComposite(garmentUrl, designUrl, pos.x, pos.y, pos.size);
          if (placementBase64) {
            attachments.push({ filename: `placement-${side}.png`, content: placementBase64, content_type: "image/png" });
            attachmentHtml += `<li>placement-${side}.png - Design position on garment</li>`;
          }
        }

        // 4. SVG vector
        const svgBase64 = await vectorizeDesign(designUrl);
        if (svgBase64) {
          attachments.push({ filename: `vector-${side}.svg`, content: svgBase64, content_type: "image/svg+xml" });
          attachmentHtml += `<li>vector-${side}.svg - Vector file (16 colors)</li>`;
        }

        attachmentHtml += "</ul>";
      }

      const positionInfo = positionsData.map(p =>
        `${p.view}: x=${Math.round(p.x)}%, y=${Math.round(p.y)}%, size=${Math.round((p.size / 780) * 700)}mm`
      ).join("<br>");

      const emailHtml = `
        <div style="font-family: system-ui, sans-serif; max-width: 600px;">
          <h1 style="color: #f59e0b;">TinyThread - New Order</h1>
          <hr style="border: 1px solid #eee;">
          <h2>Order #${orderNumber}</h2>
          <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
          <h3>Specifications:</h3>
          <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Product</td><td style="padding: 8px; border: 1px solid #ddd;">${item.title}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Style</td><td style="padding: 8px; border: 1px solid #ddd;">${style}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Size</td><td style="padding: 8px; border: 1px solid #ddd;">${size}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Placement</td><td style="padding: 8px; border: 1px solid #ddd;">${placement}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Designs</td><td style="padding: 8px; border: 1px solid #ddd;">${designCount}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Price</td><td style="padding: 8px; border: 1px solid #ddd;">${item.price}</td></tr>
          </table>
          ${positionInfo ? `<p style="margin-top: 12px; font-size: 13px;"><strong>Position:</strong><br>${positionInfo}</p>` : ""}
          <h3>Attachments (${attachments.length} files):</h3>
          ${attachmentHtml || "<p>No attachments generated</p>"}
          <p style="font-size: 12px; color: #999; margin-top: 8px;">Per side: original photo, generated design, placement on garment, SVG vector</p>
          <hr style="border: 1px solid #eee; margin-top: 24px;">
          <p style="color: #999; font-size: 12px;">TinyThread Studio</p>
        </div>
      `;

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": "Bearer re_GMuGpfwE_E1cAyaCFg11J354XszsD1DLo", "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "TinyThread Orders <onboarding@resend.dev>",
          to: ["karvelsm@gmail.com"],
          subject: `New Order #${orderNumber} - ${item.title}`,
          html: emailHtml,
          attachments,
        }),
      });
      const emailData = await emailRes.json();
      console.log("[WEBHOOK] Email sent:", emailData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WEBHOOK] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
