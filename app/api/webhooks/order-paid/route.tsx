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

const SHOPIFY_STORE = process.env.SHOPIFY_STORE!;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const SHOP_GID = process.env.SHOPIFY_SHOP_GID!;

async function shopifyGQL(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/graphql.json`, {
    method: "POST",
    headers: { "X-Shopify-Access-Token": SHOPIFY_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

// Embroidery fonts. All free Google Fonts.
const FONT_CSS_MAP: Record<string, string> = {
  montserrat: "'Montserrat', sans-serif",
  anton:      "'Anton', sans-serif",
  quicksand:  "'Quicksand', sans-serif",
  greatvibes: "'Great Vibes', cursive",
  sacramento: "'Sacramento', cursive",
  cinzel:     "'Cinzel', serif",
  // legacy fallbacks for old orders
  brittany: "'Great Vibes', cursive",
  moontine: "'Sacramento', cursive",
  cocogothic: "'Montserrat', sans-serif",
  sans: "system-ui, -apple-system, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', monospace",
  script: "'Brush Script MT', cursive",
  display: "Impact, sans-serif",
};
const FONT_NAME_MAP: Record<string, string> = {
  montserrat: "Montserrat",
  anton: "Anton",
  quicksand: "Quicksand",
  greatvibes: "Great Vibes",
  sacramento: "Sacramento",
  cinzel: "Cinzel",
  // legacy fallbacks for old orders
  brittany: "Brittany",
  moontine: "Moontine",
  cocogothic: "Coco Gothic SC",
  sans: "Sans Serif", serif: "Serif", mono: "Monospace", script: "Cursive", display: "Display",
};
const TEXT_COLOR_MAP: Record<string, string> = {
  white: "#FFFFFF", black: "#000000", red: "#D8315B", blue: "#3E92CC", navy: "#0A2463",
  yellow: "#F5C518", green: "#2E7D32", orange: "#E55934", pink: "#E94B7B", gold: "#C9A227", silver: "#C0C0C0",
};
function colorLabelToHex(label: string, garmentColor: string): string {
  if (!label || label.toLowerCase() === "auto") return garmentColor === "white" ? "#000000" : "#FFFFFF";
  if (label.startsWith("#")) return label;
  return TEXT_COLOR_MAP[label.toLowerCase()] || (garmentColor === "white" ? "#000000" : "#FFFFFF");
}

async function generateTextComposite(garmentUrl: string, textContent: string, fontId: string, garmentColor: string, posX: number, posY: number, designSizePx: number, textColorHex?: string): Promise<string | null> {
  try {
    const W = 800, H = 1000;
    const designSize = Math.round((designSizePx / 780) * W);
    const left = Math.round(W * posX / 100 - designSize / 2);
    const top = Math.round(H * posY / 100 - designSize / 2);
    const textColor = textColorHex || (garmentColor === "white" ? "#000000" : "#FFFFFF");
    const fontSize = Math.max(20, designSize / 6);
    const fontFamily = FONT_CSS_MAP[fontId] || FONT_CSS_MAP.sans;

    const img = new ImageResponse(
      (<div style={{ width: W, height: H, position: "relative", display: "flex" }}>
        <img src={garmentUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }} />
        <div style={{
          position: "absolute",
          left, top,
          width: designSize,
          height: designSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontFamily,
          fontWeight: 700,
          fontSize,
          color: textColor,
          lineHeight: 1.1,
          padding: 4,
        }}>{textContent}</div>
      </div>),
      { width: W, height: H }
    );
    const buf = await img.arrayBuffer();
    return Buffer.from(buf).toString("base64");
  } catch (e) { console.error("[WEBHOOK] Text composite error:", e); return null; }
}

type CompositeItem =
  | { kind: "image"; url: string; left: number; top: number; size: number }
  | { kind: "text"; content: string; fontFamily: string; color: string; left: number; top: number; size: number };

async function generateCombinedComposite(garmentUrl: string, items: CompositeItem[]): Promise<string | null> {
  try {
    const W = 800, H = 1000;
    const img = new ImageResponse(
      (<div style={{ width: W, height: H, position: "relative", display: "flex" }}>
        <img src={garmentUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }} />
        {items.map((item, i) =>
          item.kind === "image"
            ? <img key={i} src={item.url} width={item.size} height={item.size} style={{ position: "absolute", left: item.left, top: item.top, width: item.size, height: item.size }} />
            : <div key={i} style={{
                position: "absolute",
                left: item.left, top: item.top,
                width: item.size, height: item.size,
                display: "flex", alignItems: "center", justifyContent: "center",
                textAlign: "center", fontFamily: item.fontFamily, fontWeight: 700,
                fontSize: Math.max(20, item.size / 6), color: item.color, lineHeight: 1.1, padding: 4,
              }}>{item.content}</div>
        )}
      </div>),
      { width: W, height: H }
    );
    const buf = await img.arrayBuffer();
    return Buffer.from(buf).toString("base64");
  } catch (e) { console.error("[WEBHOOK] Combined composite error:", e); return null; }
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
      headers: { "Authorization": "Basic " + btoa(process.env.VECTORIZER_API_KEY!) },
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
        { input: [{ ownerId: SHOP_GID, namespace: "tinythread_processed", key, value: new Date().toISOString(), type: "single_line_text_field" }] }
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

      const screenshotFrontUrl = getProp("_screenshot_front");
      const screenshotBackUrl  = getProp("_screenshot_back");

      // Parse text embroidery info: 'TEXT (font: Sans, 100mm, color: Red, front) | TEXT2 (font: Serif, 80mm, color: Auto, back)'
      // Backwards-compatible: also accepts old format without color: 'TEXT (font: Sans, 100mm, front)'
      const textEmbProp = getProp("Text Embroidery");
      const textsByView: Record<string, { content: string; fontName: string; sizeMm: number; fontId: string; colorLabel: string }> = {};
      if (textEmbProp) {
        const entries = textEmbProp.split(" | ");
        for (const entry of entries) {
          // New format with color
          let m = entry.match(/^"(.+)" \(font: (.+?), (\d+)mm, color: (.+?), (front|back)\)$/);
          if (m) {
            const [, content, fontName, sizeStr, colorLabel, vw] = m;
            const fontId = Object.keys(FONT_NAME_MAP).find(k => FONT_NAME_MAP[k] === fontName) || "sans";
            textsByView[vw] = { content, fontName, sizeMm: parseInt(sizeStr), fontId, colorLabel };
            continue;
          }
          // Old format without color
          m = entry.match(/^"(.+)" \(font: (.+?), (\d+)mm, (front|back)\)$/);
          if (m) {
            const [, content, fontName, sizeStr, vw] = m;
            const fontId = Object.keys(FONT_NAME_MAP).find(k => FONT_NAME_MAP[k] === fontName) || "sans";
            textsByView[vw] = { content, fontName, sizeMm: parseInt(sizeStr), fontId, colorLabel: "Auto" };
          }
        }
      }
      const garmentColorVal = (frontGarmentRef || backGarmentRef || "").includes("white") ? "white" : "black";

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
              if (originals.front.startsWith("http")) {
                // It's a URL (from saved designs) - fetch and convert to base64
                const res = await fetch(originals.front);
                if (res.ok) frontOriginalBase64 = Buffer.from(await res.arrayBuffer()).toString("base64");
              } else {
                frontOriginalBase64 = originals.front.includes(",") ? originals.front.split(",")[1] : originals.front;
              }
            }
            if (originals.back) {
              if (originals.back.startsWith("http")) {
                const res = await fetch(originals.back);
                if (res.ok) backOriginalBase64 = Buffer.from(await res.arrayBuffer()).toString("base64");
              } else {
                backOriginalBase64 = originals.back.includes(",") ? originals.back.split(",")[1] : originals.back;
              }
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
        const textInfo = textsByView[side];

        const screenshotUrl = side === "front" ? screenshotFrontUrl : screenshotBackUrl;

        // Include this side if it has a design, text, or a screenshot (so designer sees empty back too)
        if (!designUrl && !textInfo && !screenshotUrl) continue;

        attachmentHtml += `<h4 style="margin-top: 16px; color: #3e92cc;">${label} Design:</h4><ul style="font-size: 13px; color: #666;">`;

        // 1. Composite mockup — screenshot from browser (exact customer view) or server-side fallback
        if (screenshotUrl) {
          const screenshotBase64 = await fetchImageAsBase64(screenshotUrl);
          if (screenshotBase64) {
            attachments.push({ filename: `placement-${side}.png`, content: screenshotBase64, content_type: "image/png" });
            attachmentHtml += `<li>placement-${side}.png - Composite mockup (customer view screenshot)</li>`;
          }
          // Still list text specs as info (already visible in the screenshot)
          if (textInfo) {
            const textHex = colorLabelToHex(textInfo.colorLabel, garmentColorVal);
            attachmentHtml += `<li><strong>TEXT:</strong> "${textInfo.content}" — Font: ${textInfo.fontName}, Size: ${textInfo.sizeMm}mm, Thread color: ${textInfo.colorLabel} (${textHex})</li>`;
          }
        } else {
          // Fallback: one combined composite server-side (backwards compat for orders without screenshots)
          if (garmentUrl && (designUrl || textInfo)) {
            const W = 800, H = 1000;
            const combinedItems: CompositeItem[] = [];
            if (designUrl) {
              const size = Math.round((pos.size / 780) * W);
              combinedItems.push({ kind: "image", url: designUrl, size, left: Math.round(W * pos.x / 100 - size / 2), top: Math.round(H * pos.y / 100 - size / 2) });
            }
            if (textInfo) {
              const sizePx = Math.round((textInfo.sizeMm / 700) * 780);
              const size = Math.round((sizePx / 780) * W);
              const textHex = colorLabelToHex(textInfo.colorLabel, garmentColorVal);
              combinedItems.push({ kind: "text", content: textInfo.content, fontFamily: FONT_CSS_MAP[textInfo.fontId] || FONT_CSS_MAP.sans, color: textHex, size, left: Math.round(W * pos.x / 100 - size / 2), top: Math.round(H * pos.y / 100 - size / 2) });
              attachmentHtml += `<li><strong>TEXT:</strong> "${textInfo.content}" — Font: ${textInfo.fontName}, Size: ${textInfo.sizeMm}mm, Thread color: ${textInfo.colorLabel} (${textHex})</li>`;
            }
            const placementBase64 = await generateCombinedComposite(garmentUrl, combinedItems);
            if (placementBase64) {
              attachments.push({ filename: `placement-${side}.png`, content: placementBase64, content_type: "image/png" });
              attachmentHtml += `<li>placement-${side}.png - Composite mockup (design on garment)</li>`;
            }
          }
        }

        if (!designUrl) { attachmentHtml += "</ul>"; continue; }

        // 2. Generated embroidery design — clean, no background
        const generatedBase64 = await fetchImageAsBase64(designUrl);
        if (generatedBase64) {
          attachments.push({ filename: `generated-${side}.png`, content: generatedBase64, content_type: "image/png" });
          attachmentHtml += `<li>generated-${side}.png - Embroidery design (clean, no background)</li>`;
        }

        // 3. SVG vector
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
          <h1 style="color: #3e92cc;">TinyThread - New Order</h1>
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
          <p style="font-size: 12px; color: #999; margin-top: 8px;">Per side: composite mockup (design on garment), embroidery design (clean), SVG vector</p>
          <hr style="border: 1px solid #eee; margin-top: 24px;">
          <p style="color: #999; font-size: 12px;">TinyThread Studio</p>
        </div>
      `;

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
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
