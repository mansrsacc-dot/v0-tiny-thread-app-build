import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log("[WEBHOOK] Order paid received:", body.id);
    
    // Extract order details
    const orderNumber = body.order_number || body.name || "Unknown";
    const customerEmail = body.email || "Unknown";
    const customerName = body.shipping_address?.name || body.billing_address?.name || customerEmail;
    
    // Get line items with custom properties
    const lineItems = body.line_items || [];
    
    for (const item of lineItems) {
      const properties = item.properties || [];
      const style = properties.find((p: { name: string; value: string }) => p.name === "Embroidery Style")?.value || "Unknown";
      const size = properties.find((p: { name: string; value: string }) => p.name === "Embroidery Size")?.value || "Unknown";
      const placement = properties.find((p: { name: string; value: string }) => p.name === "Placement")?.value || "Unknown";
      const designCount = properties.find((p: { name: string; value: string }) => p.name === "Design Count")?.value || "1";
      const designImageUrl = properties.find((p: { name: string; value: string }) => p.name === "_design_image")?.value || null;
      const garmentRef = properties.find((p: { name: string; value: string }) => p.name === "_garment")?.value || null;
      const positions = properties.find((p: { name: string; value: string }) => p.name === "_positions")?.value || "[]";
      
      // Garment image URLs stored on Vercel Blob
      const GARMENT_URLS: Record<string, string> = {
        "hoodie-black-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-black-front-L8JNMTYtT2Xneu4ym3Ax12fau4pIHq.jpg",
        "hoodie-black-back": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-black-back-Lfr4AB79XMlYiUB9Qa9V4CSpdwQJQM.jpg",
        "hoodie-white-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-white-front-k4zZvfmeQ2iVRi7MzQy94KPnW4ebyY.jpg",
        "hoodie-white-back": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-white-back.jpg-X5I6sYplyDPZPlPnUEP1gK81mtIe8Q.jpeg",
        "cap-black-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cap-black-front.jpg-MIVejSe8JWwmgLY47q8dnpjKC393xd.jpeg",
        "cap-white-front": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cap-white-front-kYisZ76gyCeeLb3IYogIXdTJo7mXkO.jpg",
      };
      
      // Get garment image URL from the mapping
      const garmentImageUrl = garmentRef ? GARMENT_URLS[garmentRef] || null : null;
      
      // Parse position info for designer
      let positionInfo = "";
      try {
        const posData = JSON.parse(positions);
        positionInfo = posData.map((p: { view: string; x: number; y: number; size: number }) => 
          `${p.view}: offset x=${p.x}%, y=${p.y}%, size=${Math.round((p.size / 780) * 700)}mm`
        ).join("<br>");
      } catch(e) {
        // ignore parse errors
      }
      
      console.log("[WEBHOOK] Item:", item.title, "Style:", style, "Size:", size);
      
      // Build vectorize URL for on-demand EPS download (no inline vectorization to avoid timeouts)
      const vectorizeUrl = designImageUrl 
        ? `https://v0-tiny-thread-app-build.vercel.app/api/vectorize-and-send?image=${encodeURIComponent(designImageUrl)}&order=${orderNumber}`
        : null;
      
      // Send email to designer (fast - no vectorization)
      const emailBody = {
        from: "TinyThread Orders <onboarding@resend.dev>",
        to: ["karvelsm@gmail.com"],
        subject: `New Order #${orderNumber} — ${item.title}`,
        html: `
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
              <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Price</td><td style="padding: 8px; border: 1px solid #ddd;">${item.price}</td></tr>
            </table>
            
            <h3>Garment & Design:</h3>
            <table><tr>
              ${garmentImageUrl ? `
                <td style="padding: 8px; text-align: center; vertical-align: top;">
                  <img src="${garmentImageUrl}" alt="Garment" style="max-width: 250px; border: 1px solid #ddd; border-radius: 8px;">
                  <p style="font-size: 12px; color: #666;">Garment (place design on ${placement || 'front'})</p>
                </td>
              ` : ''}
              ${designImageUrl ? `
                <td style="padding: 8px; text-align: center; vertical-align: top;">
                  <img src="${designImageUrl}" alt="Design" style="max-width: 250px; border: 1px solid #ddd; border-radius: 8px;">
                  <p style="font-size: 12px; color: #666;">Design to embroider (${style} — ${size})</p>
                </td>
              ` : '<td><p><em>No design image attached</em></p></td>'}
            </tr></table>
            ${positionInfo ? `
              <p style="margin-top: 8px; font-size: 13px;"><strong>Position:</strong><br>${positionInfo}</p>
            ` : ''}
            
            ${vectorizeUrl ? `
              <p style="margin-top: 16px;">
                <a href="${vectorizeUrl}" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: black; font-weight: bold; border-radius: 8px; text-decoration: none;">
                  Download EPS Vector File
                </a>
              </p>
              <p style="font-size: 12px; color: #666;">Click the button above to generate and download the vectorized EPS file on-demand.</p>
            ` : '<p style="color: #999;">No design image available for vectorization.</p>'}
            
            <hr style="border: 1px solid #eee; margin-top: 24px;">
            <p style="color: #999; font-size: 12px;">This is an automated message from TinyThread Studio.</p>
          </div>
        `,
        attachments: []
      };
      
      console.log("[WEBHOOK] Sending email to designer...");
      
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": "Bearer re_GMuGpfwE_E1cAyaCFg11J354XszsD1DLo",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(emailBody)
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
