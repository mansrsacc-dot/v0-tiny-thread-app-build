import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import sharp from "sharp";
import { getShopifyAdminToken } from "@/lib/shopify-admin";

const GARMENT_URLS: Record<string, string> = {
  "hoodie-black-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-black-front-L8JNMTYtT2Xneu4ym3Ax12fau4pIHq.jpg",
  "hoodie-black-back": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-black-back-Lfr4AB79XMlYiUB9Qa9V4CSpdwQJQM.jpg",
  "hoodie-white-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-white-front-k4zZvfmeQ2iVRi7MzQy94KPnW4ebyY.jpg",
  "hoodie-white-back": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-white-back.jpg-X5I6sYplyDPZPlPnUEP1gK81mtIe8Q.jpeg",
  "cap-black-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cap-black-front.jpg-MIVejSe8JWwmgLY47q8dnpjKC393xd.jpeg",
  "cap-white-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cap-white-front-kYisZ76gyCeeLb3IYogIXdTJo7mXkO.jpg",
};

const SHOPIFY_STORE = process.env.SHOPIFY_STORE!;
const SHOP_GID = process.env.SHOPIFY_SHOP_GID!;

async function shopifyGQL(query: string, variables?: Record<string, unknown>) {
  const token = await getShopifyAdminToken();
  const res = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/graphql.json`, {
    method: "POST",
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
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
    // Font size is a vertical measurement: (sizePx/780)*H maps to garment height correctly.
    const fontSize = Math.round((designSizePx / 780) * H);
    const fontFamily = FONT_CSS_MAP[fontId] || FONT_CSS_MAP.sans;

    const img = new ImageResponse(
      (<div style={{ width: W, height: H, position: "relative", display: "flex", background: "#ffffff" }}>
        <img src={garmentUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "contain" }} />
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
  | { kind: "text"; content: string; fontFamily: string; color: string; left: number; top: number; size: number; fontSize: number };

async function generateCombinedComposite(garmentUrl: string, items: CompositeItem[]): Promise<string | null> {
  try {
    const W = 800, H = 1000;
    const img = new ImageResponse(
      (<div style={{ width: W, height: H, position: "relative", display: "flex", background: "#ffffff" }}>
        <img src={garmentUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "contain" }} />
        {items.map((item, i) =>
          item.kind === "image"
            ? <img key={i} src={item.url} width={item.size} height={item.size} style={{ position: "absolute", left: item.left, top: item.top, width: item.size, height: item.size }} />
            : <div key={i} style={{
                position: "absolute",
                left: item.left, top: item.top,
                width: item.size, height: item.size,
                display: "flex", alignItems: "center", justifyContent: "center",
                textAlign: "center", fontFamily: item.fontFamily, fontWeight: 700,
                fontSize: item.fontSize, color: item.color, lineHeight: 1.1, padding: 4,
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
      (<div style={{ width: W, height: H, position: "relative", display: "flex", background: "#ffffff" }}>
        <img src={garmentUrl} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "contain" }} />
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

// Count non-transparent pixels to get actual embroidery fill fraction.
// sizePx is the design's bounding-box size in the 780px-tall preview coordinate space.
async function analyzeDesignImage(url: string, sizePx: number): Promise<{
  widthMm: number; heightMm: number; fillFraction: number;
} | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());

    const instance = sharp(buf);
    const meta = await instance.metadata();
    const imgW = meta.width;
    const imgH = meta.height;
    if (!imgW || !imgH) return null;

    // Compute rendered dimensions respecting object-contain into sizePx × sizePx
    const ir = imgW / imgH;
    let dw: number, dh: number;
    if (ir >= 1) { dw = sizePx; dh = Math.round(sizePx / ir); }
    else         { dh = sizePx; dw = Math.round(sizePx * ir); }
    // Convert px to TRUE mm (canvas 780 units = 500mm reference zone width; garment-independent)
    const widthMm  = Math.round((dw / 780) * 500);
    const heightMm = Math.round((dh / 780) * 500);

    // Extract raw RGBA pixel data and count non-transparent pixels (alpha > 0)
    const { data } = await instance.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let nonTransparent = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) nonTransparent++;
    }
    const total = imgW * imgH;
    const fillFraction = total > 0 ? nonTransparent / total : 1;

    return { widthMm, heightMm, fillFraction };
  } catch (e) {
    console.error("[WEBHOOK] analyzeDesignImage error:", e);
    return null;
  }
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

  if (!orderId) {
    return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
  }

  // Deduplication: check-then-claim using Vercel Blob.
  //
  // The marker is written IMMEDIATELY after the check (before any slow work).
  // Shopify retries arrive ~5-19s later — by then the marker exists and the
  // retry is skipped. Writing after emails (old approach) left a large window
  // where a retry could pass the check while the first invocation was still running.
  const dedupBlobPath = `processed/order_${orderId}.txt`;
  const invocationId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  console.log(`[WEBHOOK] [${orderId}] Invocation ${invocationId} — checking dedup marker`);
  try {
    const { blobs } = await list({ prefix: `processed/order_${orderId}` });
    if (blobs.length > 0) {
      console.log(`[WEBHOOK] [${orderId}] Marker already exists — skipping (invocation ${invocationId})`);
      return NextResponse.json({ success: true, skipped: true });
    }
    console.log(`[WEBHOOK] [${orderId}] No marker found — claiming order (invocation ${invocationId})`);
  } catch (e) {
    console.error(`[WEBHOOK] [${orderId}] Dedup check error (continuing):`, e);
  }

  // Write the marker NOW — before any slow processing — so concurrent invocations
  // (Shopify retries) see it and skip. Worst case if this function crashes: one
  // missed email. Much better than guaranteed duplicates.
  try {
    await put(dedupBlobPath, `${invocationId} ${new Date().toISOString()}`, {
      access: "public",
      addRandomSuffix: false,
    });
    console.log(`[WEBHOOK] [${orderId}] Marker written by invocation ${invocationId}`);
  } catch (e) {
    console.error(`[WEBHOOK] [${orderId}] Failed to write dedup marker — proceeding anyway:`, e);
  }

  try {

    const orderNumber = body.order_number || body.name || "Unknown";
    const customerEmail = body.email || "Unknown";
    const customerName = body.shipping_address?.name || body.billing_address?.name || customerEmail;

    for (const item of (body.line_items || [])) {
      const properties = item.properties || [];
      const getProp = (name: string) => properties.find((p: { name: string; value: string }) => p.name === name)?.value || null;

      // Skip add-on line items (text fee, sleeve fee, additional design fee).
      // These have _for_order_ref linking them to the main item but carry no design data.
      // The main item already contains all design data and triggers the email.
      if (getProp("_for_order_ref")) {
        console.log("[WEBHOOK] Skipping add-on item:", item.title);
        continue;
      }

      const style = getProp("_embroidery_style") || getProp("Embroidery Style") || "Unknown";
      const size = getProp("_embroidery_size") || getProp("Embroidery Size") || "Unknown";
      const placement = getProp("_placement") || getProp("Placement") || "front";
      const designCount = getProp("_design_count") || getProp("Design Count") || "1";
      const orderRef = getProp("_order_ref");

      // Garment clothing size (S/M/L/XL). Prefer the _garment_size property the app
      // now sends (selected in-app after the Shopify size picker was removed); fall
      // back to the variant title ("L / Black" → first segment) for older orders.
      const garmentSize = getProp("_garment_size") || (item.variant_title as string | undefined)?.split(" / ")[0]?.trim() || null;
      // True units in this _order_ref group. The duplicate-discount split puts the design on a
      // quantity-1 "full" line, so item.quantity alone would under-report; _group_units carries N.
      const groupUnits = getProp("_group_units") || String(item.quantity ?? 1);
      // Full per-size quantity breakdown (e.g. "M ×2, L ×1") for multi-size orders; single-size
      // orders get "M ×3". Falls back to the single garment size for older orders.
      const sizeBreakdown = getProp("_size_breakdown") || garmentSize;

      const frontDesignUrl = getProp("_design_image");
      const frontGarmentRef = getProp("_garment");
      const frontGarmentUrl = frontGarmentRef ? GARMENT_URLS[frontGarmentRef] : null;

      const backDesignUrl = getProp("_design_image_back");
      const backGarmentRef = getProp("_garment_back");
      const backGarmentUrl = backGarmentRef ? GARMENT_URLS[backGarmentRef] : null;

      const leftSleeveDesignUrl  = getProp("_design_image_left_sleeve");
      const rightSleeveDesignUrl = getProp("_design_image_right_sleeve");

      const licensePlate = getProp("_license_plate") || getProp("License Plate");
      const screenshotFrontUrl      = getProp("_screenshot_front");
      const screenshotBackUrl       = getProp("_screenshot_back");
      const screenshotLeftSleeveUrl  = getProp("_screenshot_left_sleeve");
      const screenshotRightSleeveUrl = getProp("_screenshot_right_sleeve");

      // Parse Sleeve Embroidery property — check both EN and LV names
      const sleeveEmbProp = getProp("Sleeve Embroidery") || getProp("Piedurknes izšuvums");
      const sleeveTextsByView: Record<string, { content: string; fontName: string; fontId: string; colorLabel: string }> = {};
      if (sleeveEmbProp) {
        for (const entry of sleeveEmbProp.split(" | ")) {
          const m = entry.match(/^"(.+)" \(font: (.+?), 100mm, color: (.+?), (Left Sleeve|Right Sleeve)\)$/);
          if (m) {
            const [, content, fontName, colorLabel, sideLabel] = m;
            const key = sideLabel === "Left Sleeve" ? "left-sleeve" : "right-sleeve";
            const fontId = Object.keys(FONT_NAME_MAP).find(k => FONT_NAME_MAP[k] === fontName) || "sans";
            sleeveTextsByView[key] = { content, fontName, fontId, colorLabel };
          }
        }
      }

      // Parse text embroidery info: 'TEXT (font: Sans, 100mm, color: Red, front) | TEXT2 (font: Serif, 80mm, color: Auto, back)'
      // Backwards-compatible: also accepts old format without color: 'TEXT (font: Sans, 100mm, front)'
      const textEmbProp = getProp("_text_detail") || getProp("Text Embroidery");
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

      let positionsData: { view: string; x: number; y: number; size: number; rotation?: number; style?: string; type?: string; blobUrl?: string; contentScale?: number }[] = [];
      try { positionsData = JSON.parse(getProp("_positions") || "[]"); } catch {}
      // Use first photo position for each view (type="photo", or first entry for legacy orders)
      const frontPos = positionsData.find(p => p.view === "front" && p.type !== "text") || positionsData.find(p => p.view === "front") || { x: 50, y: 40, size: 150 };
      const backPos  = positionsData.find(p => p.view === "back"  && p.type !== "text") || positionsData.find(p => p.view === "back")  || { x: 50, y: 40, size: 150 };
      // Text position per view — used to correctly position text in server-side composite
      const textPosByView: Record<string, { x: number; y: number; size: number }> = {};
      for (let pi = 0; pi < positionsData.length; pi++) {
        const p = positionsData[pi];
        if (p.type === "text") { textPosByView[p.view] = p; continue; }
        if (p.type === undefined && textsByView[p.view]) {
          // Legacy heuristic: if text exists for this view, the last entry is the text position
          const viewEntries = positionsData.filter(q => q.view === p.view);
          if (viewEntries.indexOf(p) > 0) textPosByView[p.view] = p;
        }
      }

      // Pre-compute pixel-based fill analysis for each photo design (async)
      const designUrlByView: Record<string, string | null> = {
        "front": frontDesignUrl, "back": backDesignUrl,
        "left-sleeve": leftSleeveDesignUrl, "right-sleeve": rightSleeveDesignUrl,
      };
      const analysisMap: Record<string, { widthMm: number; heightMm: number; fillFraction: number } | null> = {};
      await Promise.all(
        positionsData
          .filter(p => p.type === "photo" || (p.type === undefined && !textsByView[p.view] && !sleeveTextsByView[p.view]))
          .map(async p => {
            const url = p.blobUrl || designUrlByView[p.view];
            if (url) {
              analysisMap[`${p.view}:${p.blobUrl || "legacy"}`] = await analyzeDesignImage(url, p.size);
              if (!analysisMap[p.view]) analysisMap[p.view] = analysisMap[`${p.view}:${p.blobUrl || "legacy"}`];
            }
          })
      );

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

      // Process each side including sleeves
      type SideKey = "front" | "back" | "left-sleeve" | "right-sleeve";
      for (const side of ["front", "back", "left-sleeve", "right-sleeve"] as SideKey[]) {
        const isSleeve = side === "left-sleeve" || side === "right-sleeve";
        const designUrl = side === "front" ? frontDesignUrl : side === "back" ? backDesignUrl : side === "left-sleeve" ? leftSleeveDesignUrl : rightSleeveDesignUrl;
        const garmentUrl = side === "front" ? frontGarmentUrl : side === "back" ? backGarmentUrl : null;
        const pos = side === "front" ? frontPos : side === "back" ? backPos : { x: 50, y: 40, size: 150 };
        const originalBase64 = side === "front" ? frontOriginalBase64 : side === "back" ? backOriginalBase64 : null;
        const label = isSleeve ? (side === "left-sleeve" ? "Left Sleeve" : "Right Sleeve") : side.charAt(0).toUpperCase() + side.slice(1);
        const textInfo = isSleeve ? undefined : textsByView[side];
        const sleeveTextInfo = isSleeve ? sleeveTextsByView[side] : undefined;
        const effectiveTextInfo = textInfo || (sleeveTextInfo ? { content: sleeveTextInfo.content, fontName: sleeveTextInfo.fontName, sizeMm: 100, fontId: sleeveTextInfo.fontId, colorLabel: sleeveTextInfo.colorLabel } : undefined);

        const screenshotUrl = side === "front" ? screenshotFrontUrl : side === "back" ? screenshotBackUrl : side === "left-sleeve" ? screenshotLeftSleeveUrl : screenshotRightSleeveUrl;

        // Include this side if it has a design, text, or a screenshot
        if (!designUrl && !effectiveTextInfo && !screenshotUrl) continue;

        attachmentHtml += `<h4 style="margin-top: 16px; color: #3e92cc;">${label} Design:</h4><ul style="font-size: 13px; color: #666;">`;

        // 1. Composite mockup — screenshot from browser (exact customer view) or server-side fallback
        if (screenshotUrl) {
          const screenshotBase64 = await fetchImageAsBase64(screenshotUrl);
          if (screenshotBase64) {
            attachments.push({ filename: `placement-${side}.png`, content: screenshotBase64, content_type: "image/png" });
            attachmentHtml += `<li>placement-${side}.png - Composite mockup (customer view screenshot)</li>`;
          }
          // Still list text specs as info (already visible in the screenshot)
          if (effectiveTextInfo) {
            const textHex = colorLabelToHex(effectiveTextInfo.colorLabel, garmentColorVal);
            attachmentHtml += `<li><strong>TEXT:</strong> "${effectiveTextInfo.content}" — Font: ${effectiveTextInfo.fontName}, Size: ${effectiveTextInfo.sizeMm}mm, Thread color: ${effectiveTextInfo.colorLabel} (${textHex})</li>`;
          }
        } else {
          // Fallback: server-side composite (only for front/back where garmentUrl exists)
          if (garmentUrl && (designUrl || effectiveTextInfo)) {
            const W = 800, H = 1000;
            const combinedItems: CompositeItem[] = [];
            if (designUrl) {
              const size = Math.round((pos.size / 780) * W);
              combinedItems.push({ kind: "image", url: designUrl, size, left: Math.round(W * pos.x / 100 - size / 2), top: Math.round(H * pos.y / 100 - size / 2) });
            }
            if (effectiveTextInfo) {
              // Use the text design's own position, not the photo design's position
              const tPos = textPosByView[side] || pos;
              const sizePx = Math.round((effectiveTextInfo.sizeMm / 700) * 780);
              const size = Math.round((sizePx / 780) * W);
              // Font size uses H (vertical): textMm * (H / garmentMm) = (sizePx/780) * H
              const fontSize = Math.round((sizePx / 780) * H);
              const textHex = colorLabelToHex(effectiveTextInfo.colorLabel, garmentColorVal);
              combinedItems.push({ kind: "text", content: effectiveTextInfo.content, fontFamily: FONT_CSS_MAP[effectiveTextInfo.fontId] || FONT_CSS_MAP.sans, color: textHex, size, fontSize, left: Math.round(W * tPos.x / 100 - size / 2), top: Math.round(H * tPos.y / 100 - size / 2) });
              attachmentHtml += `<li><strong>TEXT:</strong> "${effectiveTextInfo.content}" — Font: ${effectiveTextInfo.fontName}, Size: ${effectiveTextInfo.sizeMm}mm, Thread color: ${effectiveTextInfo.colorLabel} (${textHex})</li>`;
            }
            const placementBase64 = await generateCombinedComposite(garmentUrl, combinedItems);
            if (placementBase64) {
              attachments.push({ filename: `placement-${side}.png`, content: placementBase64, content_type: "image/png" });
              attachmentHtml += `<li>placement-${side}.png - Composite mockup (design on garment)</li>`;
            }
          } else if (isSleeve && designUrl) {
            // Sleeve fallback: just attach the design image (no garment composite available)
            attachmentHtml += `<li>See generated-${side}.png below for sleeve design</li>`;
          }
        }

        if (!designUrl) { attachmentHtml += "</ul>"; continue; }

        // 2. Generated embroidery design — clean, no background (first/only design)
        const generatedBase64 = await fetchImageAsBase64(designUrl);
        if (generatedBase64) {
          attachments.push({ filename: `generated-${side}.png`, content: generatedBase64, content_type: "image/png" });
          attachmentHtml += `<li>generated-${side}.png - Embroidery design (clean, no background)</li>`;
        }

        // 3. SVG vector (first/only design)
        const svgBase64 = await vectorizeDesign(designUrl);
        if (svgBase64) {
          attachments.push({ filename: `vector-${side}.svg`, content: svgBase64, content_type: "image/svg+xml" });
          attachmentHtml += `<li>vector-${side}.svg - Vector file (16 colors)</li>`;
        }

        // 4. Additional photo designs (2nd, 3rd) — only present in new orders with blobUrl in _positions
        if (!isSleeve) {
          const extraPhotoPositions = positionsData.filter(p =>
            p.view === side && p.type === "photo" && p.blobUrl && p.blobUrl !== designUrl
          );
          for (let ai = 0; ai < extraPhotoPositions.length; ai++) {
            const ap = extraPhotoPositions[ai];
            const suffix = `-${ai + 2}`;
            const extraBase64 = await fetchImageAsBase64(ap.blobUrl!);
            if (extraBase64) {
              attachments.push({ filename: `generated-${side}${suffix}.png`, content: extraBase64, content_type: "image/png" });
              attachmentHtml += `<li>generated-${side}${suffix}.png - Additional design ${ai + 2} (clean, no background)</li>`;
            }
            const extraSvg = await vectorizeDesign(ap.blobUrl!);
            if (extraSvg) {
              attachments.push({ filename: `vector-${side}${suffix}.svg`, content: extraSvg, content_type: "image/svg+xml" });
              attachmentHtml += `<li>vector-${side}${suffix}.svg - Additional design ${ai + 2} vector (16 colors)</li>`;
            }
          }
        }

        attachmentHtml += "</ul>";
      }

      // Build detailed per-design dimension info for the designer
      const positionInfo = positionsData.map(p => {
        // TRUE mm of the visible artwork: box mm × contentScale (visible extent ÷ box). Passed
        // from the client; defaults to 1 (legacy orders) so nothing regresses.
        const sizeMm = Math.round((p.size / 780) * 500 * (p.contentScale ?? 1));
        const isSleeve = p.view === "left-sleeve" || p.view === "right-sleeve";
        const label = p.view === "left-sleeve" ? "Left Sleeve"
                    : p.view === "right-sleeve" ? "Right Sleeve"
                    : p.view.charAt(0).toUpperCase() + p.view.slice(1);

        const textInfo = textsByView[p.view];
        const sleeveText = sleeveTextsByView[p.view];

        // Determine if this position entry represents a text design:
        // - New orders: use explicit type field
        // - Legacy orders: if text exists for this view and this is a non-first entry, it's text
        const viewEntries = positionsData.filter(q => q.view === p.view);
        const isTextEntry = p.type === "text" ||
          (p.type === undefined && !!textInfo && viewEntries.indexOf(p) > 0);

        let desc: string;
        if (isTextEntry && textInfo) {
          const colorHex = colorLabelToHex(textInfo.colorLabel, garmentColorVal);
          desc = `Text "${textInfo.content}" — ${textInfo.fontName}, ${sizeMm}mm width, color: ${textInfo.colorLabel} (${colorHex})`;
        } else if (isTextEntry && !textInfo) {
          return ""; // text entry but no matching textsByView — skip
        } else if (sleeveText) {
          const colorHex = colorLabelToHex(sleeveText.colorLabel, garmentColorVal);
          desc = `Text "${sleeveText.content}" — ${sleeveText.fontName}, ${sizeMm}mm width, color: ${sleeveText.colorLabel} (${colorHex})`;
        } else if (isSleeve) {
          const sideLabel = p.view === "left-sleeve" ? "Left Sleeve" : "Right Sleeve";
          const m = sleeveEmbProp?.split(" | ").find((e: string) => e.includes(sideLabel) && !e.startsWith('"'))?.match(/^(.+?) \(/);
          const styleName = m?.[1] || "Design";
          const analysis = analysisMap[p.view];
          if (analysis) {
            const areaCm2 = Math.round((analysis.widthMm * analysis.heightMm * analysis.fillFraction) / 10) / 10;
            desc = `${styleName} — ${analysis.widthMm}mm × ${analysis.heightMm}mm, faktiskā platība: ~${areaCm2} cm²`;
          } else {
            desc = `${styleName} — ${sizeMm}mm × ${sizeMm}mm`;
          }
        } else {
          // Front/back photo design — use style from _positions if available (new orders),
          // fall back to parsing the "Embroidery Style" property (legacy orders)
          const STYLE_NAME_MAP: Record<string, string> = {
            outline: "Outline (Kontūra)",
            standard: "Standard Logo",
            "pet-head": "Pet Head (Mīluļa Portrets)",
            car: "Car Embroidery (Mašīnas izšuvums)",
          };
          const styleName = p.style
            ? (STYLE_NAME_MAP[p.style] || p.style)
            : (() => {
                const styleList = style.split(", ").filter(Boolean);
                const viewIdx = p.view === "front" ? 0 : 1;
                return styleList[viewIdx] || styleList[0] || "Design";
              })();
          const analysis = analysisMap[`${p.view}:${p.blobUrl || "legacy"}`] || analysisMap[p.view];
          if (analysis) {
            const areaCm2 = Math.round((analysis.widthMm * analysis.heightMm * analysis.fillFraction) / 10) / 10;
            desc = `${styleName} — ${analysis.widthMm}mm × ${analysis.heightMm}mm, faktiskā platība: ~${areaCm2} cm²`;
          } else {
            desc = `${styleName} — ${sizeMm}mm × ${sizeMm}mm`;
          }
        }

        const rotStr = p.rotation ? ` (${Math.round(p.rotation)}° rotation)` : "";
        return `<strong>${label}:</strong> ${desc}, position x=${Math.round(p.x)}% y=${Math.round(p.y)}%${rotStr}`;
      }).filter(s => s !== "").join("<br>");

      const emailHtml = `
        <div style="font-family: system-ui, sans-serif; max-width: 600px;">
          <h1 style="color: #3e92cc;">TinyThread - New Order</h1>
          <hr style="border: 1px solid #eee;">
          <h2>Order #${orderNumber}</h2>
          <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
          <h3>Specifications:</h3>
          <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Product</td><td style="padding: 8px; border: 1px solid #ddd;">${item.title}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Quantity / Daudzums</td><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; font-size: 16px;">${groupUnits}</td></tr>
            ${(frontGarmentRef || getProp("_garment_back") || "").includes("hoodie") && sizeBreakdown ? `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Garment Size / Izmēri</td><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${sizeBreakdown}</td></tr>` : ""}
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Style</td><td style="padding: 8px; border: 1px solid #ddd;">${style}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Embroidery Size</td><td style="padding: 8px; border: 1px solid #ddd;">${size}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Placement</td><td style="padding: 8px; border: 1px solid #ddd;">${placement}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Designs</td><td style="padding: 8px; border: 1px solid #ddd;">${designCount}</td></tr>
            ${licensePlate !== null ? `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Numura zīme</td><td style="padding: 8px; border: 1px solid #ddd;">${licensePlate}</td></tr>` : ""}
          </table>
          ${positionInfo ? `<p style="margin-top: 12px; font-size: 13px;"><strong>Embroidery Details:</strong><br>${positionInfo}</p>` : ""}
          <h3>Attachments (${attachments.length} files):</h3>
          ${attachmentHtml || "<p>No attachments generated</p>"}
          <p style="font-size: 12px; color: #999; margin-top: 8px;">Per side: composite mockup (design on garment), embroidery design (clean), SVG vector</p>
          <hr style="border: 1px solid #eee; margin-top: 24px;">
          <p style="color: #999; font-size: 12px;">TinyThread Studio</p>
        </div>
      `;

      if (!process.env.RESEND_API_KEY) {
        console.error("[WEBHOOK] RESEND_API_KEY env var is not set — email NOT sent for order", orderNumber);
      } else {
        const totalSizeKB = Math.round(
          attachments.reduce((s, a) => s + a.content.length * 0.75, 0) / 1024
        );
        console.log(`[WEBHOOK] [${orderId}] inv=${invocationId} Sending email for order ${orderNumber} | item="${item.title}" | attachments=${attachments.length} | ~${totalSizeKB}KB`);
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "TinyThread Orders <orders@tinythread.shop>",
            to: ["karvelsm@gmail.com"],
            subject: `New Order #${orderNumber} - ${item.title}`,
            html: emailHtml,
            attachments,
          }),
        });
        let emailData: any;
        try { emailData = await emailRes.json(); } catch { emailData = {}; }
        if (!emailRes.ok) {
          console.error(`[WEBHOOK] Resend API error HTTP ${emailRes.status} for order ${orderNumber}:`, JSON.stringify(emailData));
        } else {
          console.log(`[WEBHOOK] [${orderId}] inv=${invocationId} Email sent OK id=${emailData?.id} order=${orderNumber}`);
        }
      }
    }

    console.log(`[WEBHOOK] [${orderId}] All done (invocation ${invocationId})`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WEBHOOK] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
