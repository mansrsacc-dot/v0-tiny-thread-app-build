import { NextRequest, NextResponse } from "next/server";

const REPLICATE_TOKEN = "r8_PFYa3C43H9QqKJVLFieVDKnfPhGr7ep4ceA1H";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    // Use Replicate's rembg model for AI background removal
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_TOKEN}`,
        "Content-Type": "application/json",
        "Prefer": "wait=60",
      },
      body: JSON.stringify({
        version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
        input: { image: imageUrl },
      }),
    });

    const data = await response.json();

    if (data.output) {
      console.log("[REMOVE-BG] Success:", typeof data.output === "string" ? data.output.substring(0, 60) : "output");
      return NextResponse.json({ imageUrl: data.output });
    }

    // If not ready yet, poll
    if (data.id && data.status !== "failed") {
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
          headers: { "Authorization": `Token ${REPLICATE_TOKEN}` },
        });
        const pollData = await pollRes.json();
        if (pollData.output) {
          return NextResponse.json({ imageUrl: pollData.output });
        }
        if (pollData.status === "failed") break;
      }
    }

    console.error("[REMOVE-BG] Failed:", data.error || "timeout");
    return NextResponse.json({ imageUrl }); // Return original if failed
  } catch (error: any) {
    console.error("[REMOVE-BG] Error:", error.message);
    return NextResponse.json({ imageUrl: req.url }, { status: 500 });
  }
}
