import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const imageUrl = req.nextUrl.searchParams.get("image");
  const order = req.nextUrl.searchParams.get("order");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
  }

  try {
    // Download the image
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();

    // Step 1: Vectorize and retain result for download
    const formData = new FormData();
    formData.append("image", imageBlob, "design.png");
    formData.append("processing.max_colors", "16");
    formData.append("output.gap_filler.enabled", "false");
    formData.append("policy.retention_days", "1");

    const vecResponse = await fetch("https://vectorizer.ai/api/v1/vectorize", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa("vkhpaa5kmksrknd:snt3ii13v1s63o4554clpecm68n87t27g580qvfq50qr143dp4h4")
      },
      body: formData
    });

    if (!vecResponse.ok) {
      return NextResponse.json({ error: "Vectorization failed" }, { status: 500 });
    }

    // Get the image token for downloading in AI format
    const imageToken = vecResponse.headers.get("X-Image-Token");

    if (!imageToken) {
      // Fallback: return SVG if no token (shouldn't happen with retention_days > 0)
      const svgBuffer = await vecResponse.arrayBuffer();
      return new NextResponse(Buffer.from(svgBuffer), {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="order-${order || 'design'}.svg"`,
        },
      });
    }

    // Step 2: Download in AI format using the token
    const downloadForm = new FormData();
    downloadForm.append("image.token", imageToken);
    downloadForm.append("output.format", "ai");

    const downloadResponse = await fetch("https://api.vectorizer.ai/api/v1/download", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa("vkhpaa5kmksrknd:snt3ii13v1s63o4554clpecm68n87t27g580qvfq50qr143dp4h4")
      },
      body: downloadForm
    });

    if (!downloadResponse.ok) {
      // Fallback to SVG if download fails
      console.error("[VECTORIZE] Download failed, falling back to SVG");
      const svgBuffer = await vecResponse.arrayBuffer();
      return new NextResponse(Buffer.from(svgBuffer), {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="order-${order || 'design'}.svg"`,
        },
      });
    }

    const aiBuffer = await downloadResponse.arrayBuffer();

    return new NextResponse(Buffer.from(aiBuffer), {
      headers: {
        "Content-Type": "application/illustrator",
        "Content-Disposition": `attachment; filename="order-${order || 'design'}.ai"`,
      },
    });
  } catch (error) {
    console.error("[VECTORIZE] Failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
