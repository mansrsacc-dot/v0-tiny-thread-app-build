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
    formData.append("output.format", "ai");
    formData.append("processing.max_colors", "16");
    formData.append("output.gap_filler.enabled", "false");

    const response = await fetch("https://vectorizer.ai/api/v1/vectorize", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(process.env.VECTORIZER_API_KEY!)
      },
      body: formData
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Vectorization failed" }, { status: 500 });
    }

    const aiBuffer = await response.arrayBuffer();
    const aiBase64 = "data:application/illustrator;base64," + Buffer.from(aiBuffer).toString("base64");

    return NextResponse.json({ epsUrl: aiBase64 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
