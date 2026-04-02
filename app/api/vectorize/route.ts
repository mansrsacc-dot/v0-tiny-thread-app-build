import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    // Download the image from URL first
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();

    // Send to Vectorizer.AI
    const formData = new FormData();
    formData.append("image", imageBlob, "design.png");
    formData.append("output.format", "eps");

    const response = await fetch("https://vectorizer.ai/api/v1/vectorize", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa("vkhpaa5kmksrknd:snt3ii13v1s63o4554clpecm68n87t27g580qvfq50qr143dp4h4")
      },
      body: formData
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Vectorization failed" }, { status: 500 });
    }

    const epsBuffer = await response.arrayBuffer();
    const epsBase64 = "data:application/postscript;base64," + Buffer.from(epsBuffer).toString("base64");

    return NextResponse.json({ epsUrl: epsBase64 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
