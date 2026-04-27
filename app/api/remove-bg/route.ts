import { NextRequest, NextResponse } from "next/server";

const REPLICATE_TOKEN = "r8_PFYa3C43H9QqKJVLFieVDKnfPhGr7ep4ceA1H";
const REMBG_VERSION = "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_TOKEN}`,
        "Content-Type": "application/json",
        "Prefer": "wait=55",
      },
      body: JSON.stringify({
        version: REMBG_VERSION,
        input: { image: imageUrl },
      }),
    });

    let data = await response.json();

    // If output is ready immediately, return it
    if (data.output) {
      return NextResponse.json({ imageUrl: data.output });
    }

    // Otherwise, poll until succeeded or failed (rembg is fast - usually <10s)
    const pollUrl = data?.urls?.get;
    if (pollUrl) {
      for (let i = 0; i < 25; i++) {
        await new Promise(r => setTimeout(r, 1500));
        const pollRes = await fetch(pollUrl, {
          headers: { "Authorization": `Token ${REPLICATE_TOKEN}` },
        });
        data = await pollRes.json();
        if (data.status === "succeeded" && data.output) {
          return NextResponse.json({ imageUrl: data.output });
        }
        if (data.status === "failed" || data.status === "canceled") {
          console.error("[REMOVE-BG] Failed:", data.error);
          return NextResponse.json({ imageUrl: "", error: data.error || "Failed" }, { status: 500 });
        }
      }
    }

    // Timeout - return empty so the frontend keeps the original (it'll fall back gracefully)
    console.warn("[REMOVE-BG] Polling timed out");
    return NextResponse.json({ imageUrl: "", error: "Timeout" }, { status: 504 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown";
    console.error("[REMOVE-BG] Exception:", msg);
    return NextResponse.json({ imageUrl: "", error: msg }, { status: 500 });
  }
}
