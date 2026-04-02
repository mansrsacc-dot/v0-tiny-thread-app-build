import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product, garmentColor, designs, mockupScreenshot, vectorFile } = body;

    // For now, log the order data — we will connect email later
    console.log("=== NEW ORDER FOR DESIGNER ===");
    console.log("Product:", product, garmentColor);
    designs.forEach((d: { style: string; size: string; view: string; sizeMm: number }, i: number) => {
      console.log(`Design ${i + 1}:`, d.style, d.size, d.view, d.sizeMm + "mm");
    });
    console.log("Has mockup:", !!mockupScreenshot);
    console.log("Has vector:", !!vectorFile);
    console.log("==============================");

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
