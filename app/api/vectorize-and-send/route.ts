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

    // Vectorize
    const formData = new FormData();
    formData.append("image", imageBlob, "design.png");
    formData.append("output.format", "eps");

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

    const epsBuffer = await vecResponse.arrayBuffer();

    // Return as downloadable EPS file
    return new NextResponse(Buffer.from(epsBuffer), {
      headers: {
        "Content-Type": "application/postscript",
        "Content-Disposition": `attachment; filename="order-${order || 'design'}.eps"`,
      },
    });
  } catch (error) {
    console.error("[VECTORIZE] Failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
