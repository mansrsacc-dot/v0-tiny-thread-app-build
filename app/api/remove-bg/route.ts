import { NextRequest, NextResponse } from "next/server";

const REPLICATE_TOKEN = "r8_PFYa3C43H9QqKJVLFieVDKnfPhGr7ep4ceA1H";
const REMBG_VERSION = "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003";

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

    const data = await response.json();

    if (data.output) {
      return NextResponse.json({ imageUrl: data.output });
    }

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    return NextResponse.json({ imageUrl: "" }, { status: 500 });
  }
}
